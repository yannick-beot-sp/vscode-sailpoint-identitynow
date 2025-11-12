import * as vscode from 'vscode';
import * as tmp from "tmp";

import { ISCClient } from "../../services/ISCClient";
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { AccessProfileRef, ApprovalSchemeForRole, EntitlementRef, Role, RoleMembershipSelector, RoleMembershipSelectorType } from 'sailpoint-api-client';
import { CSVReader } from '../../services/CSVReader';
import { GovernanceGroupNameToIdCacheService } from '../../services/cache/GovernanceGroupNameToIdCacheService';
import { IdentityNameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { AccessProfileNameToIdCacheService } from '../../services/cache/AccessProfileNameToIdCacheService';
import { stringToRoleApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';
import { openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from '../../utils/stringUtils';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';
import { Parser } from '../../parser/parser';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { EntitlementCacheService, KEY_SEPARATOR } from '../../services/cache/EntitlementCacheService';
import { truethy } from '../../utils/booleanUtils';
import { UserCancelledError } from '../../errors';
import { stringToAttributeMetadata } from '../../utils/metadataUtils';

interface RolesImportResult {
    success: number
    error: number
}

interface RoleCSVRecord {
    name: string
    description: string
    enabled: boolean
    requestable: boolean
    dimensional?: boolean
    owner: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    approvalSchemes: string
    revokeCommentsRequired: boolean
    revokeDenialCommentsRequired: boolean
    revokeApprovalSchemes: string
    accessProfiles: string
    entitlements: string
    membershipCriteria: string
    metadata: string
}

export class RoleImporter {
    readonly client: ISCClient;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);

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
            cancellable: true
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
        const entitlementCacheService = new EntitlementCacheService(this.client);
        const parser = new Parser();
        try {
            await csvReader.processLine(async (data: RoleCSVRecord) => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
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
                    const srcMessage = `Unable to find owner with name '${data.owner}' in ISC`;
                    await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let accessProfiles: AccessProfileRef[] = [];
                if (isNotBlank(data.accessProfiles)) {
                    try {
                        accessProfiles = await Promise.all(data.accessProfiles.split(CSV_MULTIVALUE_SEPARATOR).map(async (apName) => ({
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
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let entitlements: EntitlementRef[] = []
                if (isNotBlank(data.entitlements)) {
                    try {
                        entitlements = await Promise.all(data.entitlements
                            .split(CSV_MULTIVALUE_SEPARATOR)
                            .map(async (sourceAndEntitlementNames) => {
                                const [sourceName, entitlementName] = sourceAndEntitlementNames.split(KEY_SEPARATOR)
                                const sourceId = await sourceCacheService.get(sourceName)
                                const entitlementId = await entitlementCacheService.get([sourceId, entitlementName].join(KEY_SEPARATOR))
                                return {
                                    name: entitlementName,
                                    "id": entitlementId,
                                    "type": "ENTITLEMENT"
                                }
                            }));
                    } catch (error) {
                        result.error++;
                        const etMessage = `Unable to find access an entitlement: ${error}`;
                        await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, etMessage);
                        vscode.window.showErrorMessage(etMessage);
                        return;
                    }
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let approvalSchemes: ApprovalSchemeForRole[] | undefined = undefined,
                    revokeApprovalSchemes: ApprovalSchemeForRole[] | undefined = undefined;
                try {
                    approvalSchemes = await stringToRoleApprovalSchemeConverter(
                        data.approvalSchemes, governanceGroupCache);
                    revokeApprovalSchemes = await stringToRoleApprovalSchemeConverter(
                        data.revokeApprovalSchemes, governanceGroupCache);
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to build approval scheme: ${error}`;
                    await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
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
                    "enabled": truethy(data.enabled),
                    requestable: truethy(data.requestable),
                    dimensional: truethy(data.dimensional),
                    "owner": {
                        "id": ownerId,
                        "type": "IDENTITY",
                        "name": data.owner
                    },
                    "accessRequestConfig": {
                        "commentsRequired": truethy(data.commentsRequired),
                        "denialCommentsRequired": truethy(data.denialCommentsRequired),
                        "approvalSchemes": approvalSchemes
                    },
                    "revocationRequestConfig": {
                        "commentsRequired": truethy(data.revokeCommentsRequired),
                        "denialCommentsRequired": truethy(data.revokeDenialCommentsRequired),
                        "approvalSchemes": revokeApprovalSchemes
                    },
                    accessProfiles,
                    entitlements,
                    membership
                };

                
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }
                processedLines++

                try {
                    const newRole = await this.client.createRole(rolePayload);
                    if (data.metadata) {
                        const attributes = stringToAttributeMetadata(data.metadata)
                        await this.client.updateRoleMetadata(
                            newRole.id,
                            attributes
                        )
                    }

                    await this.writeLog(processedLines, roleName, CSVLogWriterLogType.SUCCESS, `Successfully imported role '${data.name}'`);
                    result.success++;
                } catch (error: any) {
                    result.error++;
                    await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot create role: '${error.message}' in ISC`);
                }
            });
        } catch { }
        const message = `${processedLines} line(s) processed. ${result.success} sucessfully import. ${result.error} error(s).`;

        if (result.error === processedLines) {
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
        console.log("Entitlement Cache stats", entitlementCacheService.getStats());
        entitlementCacheService.flushAll();
        await openPreview(this.logFilePath, "log");
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