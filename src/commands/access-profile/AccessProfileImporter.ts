import * as tmp from "tmp";
import * as vscode from 'vscode';
import { AccessProfile, EntitlementBeta, JsonPatchOperationV2025OpV2025 } from 'sailpoint-api-client';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { CSVReader } from '../../services/CSVReader';
import { ISCClient } from "../../services/ISCClient";
import { EntitlementCacheService, KEY_SEPARATOR } from '../../services/cache/EntitlementCacheService';
import { GovernanceGroupNameToIdCacheService } from '../../services/cache/GovernanceGroupNameToIdCacheService';
import { WorkflowNameToIdCacheService } from '../../services/cache/WorkflowNameToIdCacheService';
import { IdentityNameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { stringToAccessProfileApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';
import { importMode, ImportModeType, openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from "../../utils/stringUtils";
import { truethy } from "../../utils/booleanUtils";
import { UserCancelledError } from "../../errors";
import { stringToAttributeMetadata } from "../../utils/metadataUtils";
import { ImportResult } from "../../models/ImportResult";

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
    metadata: string
}

export class AccessProfileImporter {
    readonly client: ISCClient;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private fileUri: vscode.Uri,
        private mode: ImportModeType
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
            cancellable: true
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

        const result: ImportResult = {
            success: 0,
            error: 0
        };

        const governanceGroupCache = new GovernanceGroupNameToIdCacheService(this.client);
        const workflowCache = new WorkflowNameToIdCacheService(this.client);
        await workflowCache.init()
        const identityCacheService = new IdentityNameToIdCacheService(this.client);
        const sourceCacheService = new SourceNameToIdCacheService(this.client);
        const entitlementCacheService = new EntitlementCacheService(this.client);

        let processedLines = 0;
        try {
            await csvReader.processLine(async (data: AccessProfileCSVRecord) => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
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
                    const srcMessage = `Unable to find source with name '${data.source}' in ISC`;
                    await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let ownerId: string;
                try {
                    ownerId = await identityCacheService.get(data.owner);
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to find owner with name '${data.owner}' in ISC`;
                    await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let entitlements: EntitlementBeta[] = [];
                if (isNotBlank(data.entitlements)) {
                    try {
                        entitlements = await Promise.all(data.entitlements?.split(CSV_MULTIVALUE_SEPARATOR).map(async (entitlementStr) => {
                            const parts = entitlementStr.split(KEY_SEPARATOR);
                            let entitlementId: string;
                            let entitlementName: string;

                            if (parts.length === 2) {
                                // New format: attribute|name
                                const [attribute, name] = parts;
                                entitlementName = name;
                                entitlementId = await entitlementCacheService.get(
                                    [sourceId, attribute, entitlementName].join(KEY_SEPARATOR))

                            } else if (parts.length === 1) {
                                // Legacy format: name only
                                entitlementName = entitlementStr;
                                entitlementId = await entitlementCacheService.get(
                                    [sourceId, entitlementName].join(KEY_SEPARATOR)
                                );
                            } else {
                                throw Error(`invalid entitlement format: ${entitlementStr}`)
                            }

                            return {
                                name: entitlementName,
                                id: entitlementId,
                                type: "ENTITLEMENT"
                            };
                        }));
                    } catch (error) {
                        result.error++;
                        const srcMessage = `Unable to find entitlement: ${error}`;
                        await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                        vscode.window.showErrorMessage(srcMessage);
                        return;
                    }
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let approvalSchemes, revokeApprovalSchemes;
                try {
                    approvalSchemes = await stringToAccessProfileApprovalSchemeConverter(
                        data.approvalSchemes, governanceGroupCache, workflowCache);
                    revokeApprovalSchemes = await stringToAccessProfileApprovalSchemeConverter(
                        data.revokeApprovalSchemes, governanceGroupCache, workflowCache);
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to build approval scheme: ${error}`;
                    await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, srcMessage);
                    vscode.window.showErrorMessage(srcMessage);
                    return;
                }
                const description = data.description
                const accessProfilePayload: AccessProfile = {
                    "name": apName,
                    description,
                    "enabled": truethy(data.enabled),
                    "requestable": truethy(data.requestable),
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
                    entitlements
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }
                processedLines++;
                try {
                    const newAP = await this.client.createAccessProfile(accessProfilePayload)

                    if (data.metadata) {
                        const attributes = stringToAttributeMetadata(data.metadata)
                        await this.client.updateAccessProfileMetadata(
                            newAP.id,
                            attributes
                        )
                    }

                    await this.writeLog(processedLines, apName, CSVLogWriterLogType.SUCCESS, `Successfully imported access profile '${data.name}'`);
                    result.success++;
                } catch (error: any) {
                    const isConflict = error.message?.endsWith("already exists.")

                    if (isConflict && this.mode === importMode.createOrUpdate) {
                        console.log(`Access Profile ${apName} already exists. Try to update...`);

                        // Try to get the id
                        const ap = await this.client.getAccessProfileByName(apName);
                        if (ap) {

                            const updates = [
                                {
                                    "property": "name",
                                    "value": apName
                                },
                                {
                                    "property": "enabled",
                                    "value": truethy(data.enabled)
                                },
                                {
                                    "property": "requestable",
                                    "value": truethy(data.requestable)
                                },
                                {
                                    "property": "description",
                                    "value": description
                                },
                                {
                                    "property": "owner",
                                    "value": {
                                        "id": ownerId,
                                        "type": "IDENTITY",
                                        "name": data.owner
                                    }
                                },
                                {
                                    "property": "accessRequestConfig",
                                    "value": {
                                        "commentsRequired": truethy(data.commentsRequired),
                                        "denialCommentsRequired": truethy(data.denialCommentsRequired),
                                        "approvalSchemes": approvalSchemes
                                    }
                                },
                                {
                                    "property": "revocationRequestConfig",
                                    "value": {
                                        "approvalSchemes": revokeApprovalSchemes
                                    }
                                },
                                {
                                    "property": "entitlements",
                                    "value": entitlements
                                },
                                {
                                    "property": "accessModelMetadata/attributes",
                                    "value": stringToAttributeMetadata(data.metadata) ?? null
                                },
                            ].map((item) => ({
                                "op": JsonPatchOperationV2025OpV2025.Replace,
                                "path": `/${item.property}`,
                                "value": item.value
                            }))
                            try {
                                await this.client.updateAccessProfile(ap.id, updates)
                                await this.writeLog(processedLines, apName, CSVLogWriterLogType.SUCCESS, `Successfully updated access profile '${apName}'`);
                                result.success++;
                            } catch (error) {
                                result.error++;
                                await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot update access profile: '${error.message}'`);

                            }

                        } else {
                            // Access Profile not found
                            // very unlikely. We shall find the access profile as we have a conflicting name
                            result.error++;
                            await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot update access profile: '${apName}' not found.`);
                        }

                    } else if (isConflict && this.mode === importMode.createOrUpdate) {
                        result.error++;
                        await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot create access profile: '${apName}' already exists.`);

                    } else {
                        result.error++;
                        await this.writeLog(processedLines, apName, CSVLogWriterLogType.ERROR, `Cannot create access profile: '${error.message}'`);
                    }
                }

            })
        } catch { }

        const message = `${processedLines} line(s) processed. ${result.success} sucessfully imported. ${result.error} error(s).`;

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
        console.log("Workflow Cache stats", workflowCache.getStats());
        workflowCache.flushAll();
        console.log("Identity Cache stats", identityCacheService.getStats());
        identityCacheService.flushAll();
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