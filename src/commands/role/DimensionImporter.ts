import * as vscode from 'vscode';
import * as tmp from "tmp";

import { ISCClient } from "../../services/ISCClient";
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { AccessProfileRef, DimensionCriteriaLevel2V2025, DimensionMembershipSelectorV2025, DimensionV2025, EntitlementRef, JsonPatchOperationV2025OpV2025, RoleMembershipSelectorType } from 'sailpoint-api-client';
import { CSVReader } from '../../services/CSVReader';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { AccessProfileNameToIdCacheService } from '../../services/cache/AccessProfileNameToIdCacheService';
import { importMode, ImportModeType, openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from '../../utils/stringUtils';
import { Parser } from '../../parser/parser';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { EntitlementCacheService, KEY_SEPARATOR } from '../../services/cache/EntitlementCacheService';
import { UserCancelledError } from '../../errors';
import { DimensionCSVRecord } from '../../models/DimensionCsvRecord';
import { ImportResult } from '../../models/ImportResult';
import { RoleNameToIdCacheService } from '../../services/cache/RoleNameToIdCacheService';
import { DimensionMembershipSelectorConverter } from '../../parser/DimensionMembershipSelectorConverter';


export class DimensionImporter {
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
            prefix: 'import-dimensions',
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
        console.log("> dimensionImporter.importFile");
        const csvReader = new CSVReader<DimensionCSVRecord>(this.fileUri.fsPath);
        await this.writeLog(null, 'Dimension', CSVLogWriterLogType.INFO, `Importing file from ${this.fileUri.fsPath} in ${this.tenantDisplayName}`);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        const result: ImportResult = {
            success: 0,
            error: 0
        };

        const roleCache = new RoleNameToIdCacheService(this.client);
        const accessProfileNameToIdCacheService = new AccessProfileNameToIdCacheService(this.client);
        const sourceCacheService = new SourceNameToIdCacheService(this.client);
        const entitlementCacheService = new EntitlementCacheService(this.client);
        const parser = new Parser();
        try {
            await csvReader.processLine(async (data: DimensionCSVRecord) => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                task.report({ increment: incr, message: data.name });
                if (isEmpty(data.name)) {
                    result.error++;
                    const nameMessage = `Missing 'name' in record`;
                    await this.writeLog(processedLines, 'dimension', CSVLogWriterLogType.ERROR, nameMessage);
                    return;
                }

                const dimensionName = data.name.trim();

                if (isEmpty(data.roleName)) {
                    result.error++;
                    const owMessage = `Missing 'roleName' in CSV`;
                    await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, owMessage);
                    vscode.window.showErrorMessage(owMessage);
                    return;
                }

                let roleId: string;
                try {
                    roleId = await roleCache.get(data.roleName);
                } catch (error) {
                    result.error++;
                    const srcMessage = `Unable to find role with name '${data.roleName}' in ISC`;
                    await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, srcMessage);
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
                        await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, etMessage);
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
                        await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, etMessage);
                        vscode.window.showErrorMessage(etMessage);
                        return;
                    }
                }

                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                let membership: DimensionMembershipSelectorV2025 | undefined = undefined;
                if (isNotBlank(data.membershipCriteria)) {
                    try {
                        const expression = parser.parse(data.membershipCriteria);

                        const converter = new DimensionMembershipSelectorConverter();
                        await converter.visitExpression(expression, undefined);

                        membership = {
                            type: RoleMembershipSelectorType.Standard,
                            criteria: {
                                operation: 'AND',
                                children: [converter.root as DimensionCriteriaLevel2V2025]
                            }

                        };
                    } catch (error) {
                        result.error++;
                        const srcMessage = `Unable to build membership criteria: ${error}`;
                        await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, srcMessage);
                        vscode.window.showErrorMessage(srcMessage);
                        return;
                    }
                }
                const description = data.description?.replaceAll("\\r", "\r").replaceAll("\\n", "\n")

                const dimensionPayload: DimensionV2025 = {
                    "name": dimensionName,
                    description,
                    accessProfiles,
                    entitlements,
                    membership,
                    owner: null
                };


                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }
                processedLines++

                try {
                    await this.client.createDimension(roleId, dimensionPayload)
                    await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.SUCCESS, `Successfully imported dimension '${data.name}'`);
                    result.success++;
                } catch (error: any) {
                    const isConflict = error.message?.includes("is already associated with ROLE")
                    if (isConflict && this.mode === importMode.createOrUpdate) {
                        console.log(`Dimension ${dimensionName} already exists. Try to update...`);

                        // Try to get the id of the dimension
                        const dimension = await this.client.getDimensionByName(roleId, dimensionName);
                        if (dimension) {

                            const updates = [
                                {
                                    "property": "description",
                                    "value": description
                                },
                                {
                                    "property": "accessProfiles",
                                    "value": accessProfiles ?? null
                                },
                                {
                                    "property": "entitlements",
                                    "value": entitlements ?? null
                                },
                                {
                                    "property": "membership",
                                    "value": membership ?? null
                                },

                            ].map((item) => ({
                                "op": JsonPatchOperationV2025OpV2025.Replace,
                                "path": `/${item.property}`,
                                "value": item.value
                            }))
                            try {
                                await this.client.updateDimension(roleId, dimension.id, updates)
                                await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.SUCCESS, `Successfully updated access profile '${dimensionName}'`);
                                result.success++;
                            } catch (error) {
                                result.error++;
                                await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, `Cannot update dimension: '${error.message}'`);

                            }

                        } else {
                            // dimension not found
                            // very unlikely. We shall find the dimension as we have a conflicting name
                            result.error++;
                            await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, `Cannot update dimension: '${dimensionName}' not found.`);
                        }

                    } else if (isConflict && this.mode === importMode.createOnly) {
                        result.error++;
                        await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, `Cannot create dimension: '${dimensionName}' already exists for ${data.roleName}.`);

                    } else {
                        result.error++;
                        await this.writeLog(processedLines, dimensionName, CSVLogWriterLogType.ERROR, `Cannot create dimension: '${error.message}'`);
                    }
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

        console.log("Role Cache stats", roleCache.getStats());
        roleCache.flushAll();
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