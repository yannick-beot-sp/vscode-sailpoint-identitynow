import * as vscode from 'vscode';
import * as tmp from "tmp";

import { IdentityNowClient } from "../../services/IdentityNowClient";
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { AccessProfileApprovalScheme, AccessProfileRef, ApprovalSchemeForRole, Role, RoleMembershipSelector, RoleMembershipSelectorType } from 'sailpoint-api-client';
import { CSVReader } from '../../services/CSVReader';
import { GovernanceGroupNameToIdCacheService } from '../../services/cache/GovernanceGroupNameToIdCacheService';
import { IdentityNameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { AccessProfileNameToIdCacheService } from '../../services/cache/AccessProfileNameToIdCacheService';
import { stringToRoleApprovalSchemeConverter, stringToAccessProfileApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';
import { openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from '../../utils/stringUtils';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';
import { Parser } from '../../parser/parser';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';

interface RolesImportResult {
    success: number
    error: number
}

interface RoleCSVRecord {
    name: string
    description: string
    enabled: boolean
    requestable: boolean
    owner: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    approvalSchemes: string
    revokeCommentsRequired: boolean
    revokeDenialCommentsRequired: boolean
    revokeApprovalSchemes: string
    accessProfiles: string
    membershipCriteria: string
}

export class RoleImporter {
    readonly client: IdentityNowClient;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);

        this.logFilePath = tmp.tmpNameSync({
            prefix: 'import-roles',
            postfix: ".log",
        });

        try {
            this.logWriter = new CSVLogWriter(this.logFilePath);
        } catch (_exc: any) {
            console.error(_exc);
            throw _exc;
        }
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing roles to ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleImporter.importFile");
        const csvReader = new CSVReader<RoleCSVRecord>(this.fileUri.fsPath);
        await this.writeLog(null, 'Role', CSVLogWriterLogType.INFO, `Importing file from ${this.fileUri.fsPath} in ${this.tenantDisplayName}`);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        const result: RolesImportResult = {
            success: 0,
            error: 0
        };

        const governanceGroupCache = new GovernanceGroupNameToIdCacheService(this.client);
        const accessProfileNameToIdCacheService = new AccessProfileNameToIdCacheService(this.client);
        const identityCacheService = new IdentityNameToIdCacheService(this.client);
        const sourceCacheService = new SourceNameToIdCacheService(this.client);
        const parser = new Parser();

        await csvReader.processLine(async (data: RoleCSVRecord) => {

            processedLines++;

            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                const nameMessage = `Missing attribute 'name' in record`;
                await this.writeLog(processedLines, 'role', CSVLogWriterLogType.ERROR, nameMessage);
                vscode.window.showErrorMessage(nameMessage);
                return;
            }

            const roleName = data.name.trim();

            if (isEmpty(data.owner)) {
                result.error++;
                const owMessage = `Missing 'owner' in CSV`;
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
                return;
            }

            let ownerId: string;
            try {
                ownerId = await identityCacheService.get(data.owner);
            } catch (error) {
                result.error++;
                const srcMessage = `Unable to find owner with name '${data.owner}' in IDN`;
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            let accessProfiles: AccessProfileRef[] = [];
            try {
                accessProfiles = await Promise.all(data.accessProfiles?.split(CSV_MULTIVALUE_SEPARATOR).map(async (apName) => ({
                    name: apName,
                    "id": (await accessProfileNameToIdCacheService.get(apName)),
                    "type": "ACCESS_PROFILE"
                })));
            } catch (error) {
                result.error++;
                const etMessage = `Unable to find access an access profile: ${error}`;
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, etMessage);
                vscode.window.showErrorMessage(etMessage);
                return;
            }

            let approvalSchemes: ApprovalSchemeForRole[],
                revokeApprovalSchemes: AccessProfileApprovalScheme[];
            try {
                approvalSchemes = await stringToRoleApprovalSchemeConverter(
                    data.approvalSchemes, governanceGroupCache);
                revokeApprovalSchemes = await stringToAccessProfileApprovalSchemeConverter(
                    data.revokeApprovalSchemes, governanceGroupCache);
            } catch (error) {
                result.error++;
                const srcMessage = `Unable to build approval scheme: ${error}`;
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            let membership: RoleMembershipSelector | undefined = undefined;
            if (isNotBlank(data.membershipCriteria)) {
                try {
                    const expression = parser.parse(data.membershipCriteria);

                    const converter = new RoleMembershipSelectorConverter(sourceCacheService);
                    await converter.visitExpression(expression, undefined);

                    membership = {
                        type: RoleMembershipSelectorType.Standard,
                        criteria: converter.root
                    };
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to build membership criteria: ${error}`;
                    await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }
            }



            const rolePayload: Role = {
                "name": roleName,
                "description": data.description?.replaceAll('\\r', '\r').replaceAll('\\n', '\n'),
                "enabled": data.enabled ?? false,
                requestable: data.requestable ?? false,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
                },
                "accessRequestConfig": {
                    "commentsRequired": data.commentsRequired ?? false,
                    "denialCommentsRequired": data.denialCommentsRequired ?? false,
                    "approvalSchemes": approvalSchemes
                },
                "revocationRequestConfig": {
                    "commentsRequired": data.revokeCommentsRequired ?? false,
                    "denialCommentsRequired": data.revokeDenialCommentsRequired ?? false,
                    "approvalSchemes": revokeApprovalSchemes
                },
                "accessProfiles": accessProfiles,
                membership
            };

            try {
                await this.client.createRole(rolePayload);
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.SUCCESS, `Successfully imported role '${data.name}'`);
                result.success++;
            } catch (error: any) {
                result.error++;
                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot create role: '${error.message}' in IDN`);
            }
        });

        const message = `${nbLines} line(s) processed. ${result.success} sucessfully import. ${result.error} error(s).`;

        if (result.error === nbLines) {
            vscode.window.showErrorMessage(message);
        } else if (result.error > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }

        try {
            this.logWriter?.end();
        } catch (_exc) {
            // do nothing hopefully
        }

        console.log("Governance Group Cache stats", governanceGroupCache.getStats());
        governanceGroupCache.flushAll();
        console.log("Identity Cache stats", identityCacheService.getStats());
        identityCacheService.flushAll();
        console.log("Access Profile Cache stats", accessProfileNameToIdCacheService.getStats());
        accessProfileNameToIdCacheService.flushAll();
        console.log("Source Cache stats", sourceCacheService.getStats());
        sourceCacheService.flushAll();
        await openPreview(vscode.Uri.file(this.logFilePath), "csv");
    }

    private async writeLog(csvLine: number | string | null, objectName: string, type: CSVLogWriterLogType, message: string) {
        let logMessage = '';
        if (this.logWriter) {
            if (!csvLine) {
                csvLine = '0';
            }
            const lnStr = '' + csvLine; // Convert to string 'old skool casting ;-)' ;-)
            logMessage = `[CSV${lnStr.padStart(8, '0')}][${objectName}] ${message}`;
            await this.logWriter.writeLine(type, logMessage);
        }
    }
}