import * as tmp from "tmp";
import * as vscode from 'vscode';
import { AccessProfile, EntitlementBeta } from 'sailpoint-api-client';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { CSVReader } from '../../services/CSVReader';
import { ISCClient } from "../../services/ISCClient";
import { EntitlementCacheService, KEY_SEPARATOR } from '../../services/cache/EntitlementCacheService';
import { GovernanceGroupNameToIdCacheService } from '../../services/cache/GovernanceGroupNameToIdCacheService';
import { IdentityNameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { stringToAccessProfileApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';
import { openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from "../../utils/stringUtils";
import { truethy } from "../../utils/booleanUtils";


interface AccessProfileImportResult {
    success: number
    error: number
}

interface AccessProfileCSVRecord {
    name: string
    description: string
    enabled: boolean
    requestable: boolean
    source: string
    owner: string
    entitlements: string
    commentsRequired: boolean
    denialCommentsRequired: boolean
    revokeApprovalSchemes: string
    approvalSchemes: string
}

export class AccessProfileImporter {
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
            prefix: 'import-accessprofiles',
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
            title: `Importing access profiles...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccessProfileImporter.importFile");
        const csvReader = new CSVReader<AccessProfileCSVRecord>(this.fileUri.fsPath);
        await this.writeLog(null, 'Access Profile', CSVLogWriterLogType.INFO, `Importing file from ${this.fileUri.fsPath} in ${this.tenantDisplayName}`);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: AccessProfileImportResult = {
            success: 0,
            error: 0
        };

        const governanceGroupCache = new GovernanceGroupNameToIdCacheService(this.client);
        const identityCacheService = new IdentityNameToIdCacheService(this.client);
        const sourceCacheService = new SourceNameToIdCacheService(this.client);
        const entitlementCacheService = new EntitlementCacheService(this.client);

        let processedLines = 0;

        await csvReader.processLine(async (data: AccessProfileCSVRecord) => {

            processedLines++;

            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                const nameMessage = `Missing attribute 'name' in record`;
                await this.writeLog(processedLines, 'Access Profile', CSVLogWriterLogType.ERROR, nameMessage);
                vscode.window.showErrorMessage(nameMessage);
                return;
            }

            const apName = data.name.trim();

            if (isEmpty(data.source)) {
                result.error++;
                const srcMessage = `Missing 'source' in CSV`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                const owMessage = `Missing 'owner' in CSV`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, owMessage);
                vscode.window.showErrorMessage(owMessage);
                return;
            }

            let sourceId: string;
            try {
                sourceId = await sourceCacheService.get(data.source);
            } catch (error) {
                result.error++;
                const srcMessage = `Unable to find source with name '${data.source}' in IDN`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            let ownerId: string;
            try {
                ownerId = await identityCacheService.get(data.owner);
            } catch (error) {
                result.error++;
                const srcMessage = `Unable to find owner with name '${data.owner}' in IDN`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            let entitlements: EntitlementBeta[] = [];
            if (isNotBlank(data.entitlements)) {
                try {
                    entitlements = await Promise.all(data.entitlements?.split(CSV_MULTIVALUE_SEPARATOR).map(async (entitlementName) => ({
                        name: entitlementName,
                        "id": (await entitlementCacheService.get([sourceId, entitlementName].join(KEY_SEPARATOR))),
                        "type": "ENTITLEMENT"
                    })));
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to find entitlement: ${error}`;
                    await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }
            }

            let approvalSchemes, revokeApprovalSchemes;
            try {
                approvalSchemes = await stringToAccessProfileApprovalSchemeConverter(
                    data.approvalSchemes, governanceGroupCache);
                revokeApprovalSchemes = await stringToAccessProfileApprovalSchemeConverter(
                    data.revokeApprovalSchemes, governanceGroupCache);
            } catch (error) {
                result.error++;
                const srcMessage = `Unable to build approval scheme: ${error}`;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                vscode.window.showErrorMessage(srcMessage);
                return;
            }

            const accessProfilePayload: AccessProfile = {
                "name": data.name,
                "description": data.description?.replaceAll("\\r", "\r").replaceAll("\\n", "\n"),
                "enabled": data.enabled ?? false,
                "requestable": data.requestable ?? false,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
                },
                "source": {
                    "id": sourceId,
                    "type": "SOURCE",
                    "name": data.source
                },
                "accessRequestConfig": {
                    "commentsRequired": truethy(data.commentsRequired),
                    "denialCommentsRequired": truethy(data.denialCommentsRequired),
                    "approvalSchemes": approvalSchemes
                },
                "revocationRequestConfig": {
                    "approvalSchemes": revokeApprovalSchemes
                },
                "entitlements": entitlements
            };

            try {
                await this.client.createResource('/v3/access-profiles', JSON.stringify(accessProfilePayload));
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.SUCCESS, `Successfully imported access profile '${data.name}'`);
                result.success++;
            } catch (error: any) {
                result.error++;
                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot create access profile: '${error.message}'`);
            }
        });

        const message = `${nbLines} line(s) processed. ${result.success} sucessfully imported. ${result.error} error(s).`;

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
        console.log("Source Cache stats", sourceCacheService.getStats());
        sourceCacheService.flushAll();
        console.log("Entitlement Cache stats", entitlementCacheService.getStats());
        entitlementCacheService.flushAll();
        await openPreview(this.logFilePath, "csv");
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