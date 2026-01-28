import * as vscode from 'vscode';
import * as tmp from "tmp";

import { ISCClient } from "../../services/ISCClient";
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { AccessProfileRef, ApprovalSchemeForRole, EntitlementRef, JsonPatchOperationV2025OpV2025, RoleMembershipSelector, RoleMembershipSelectorType, RoleV2025 } from 'sailpoint-api-client';
import { CSVReader } from '../../services/CSVReader';
import { GovernanceGroupNameToIdCacheService } from '../../services/cache/GovernanceGroupNameToIdCacheService';
import { WorkflowNameToIdCacheService } from '../../services/cache/WorkflowNameToIdCacheService';
import { IdentityNameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { AccessProfileNameToIdCacheService } from '../../services/cache/AccessProfileNameToIdCacheService';
import { stringToRoleApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';
import { importMode, ImportModeType, openPreview } from '../../utils/vsCodeHelpers';
import { isEmpty, isNotBlank } from '../../utils/stringUtils';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';
import { Parser } from '../../parser/parser';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { EntitlementCacheService, KEY_SEPARATOR } from '../../services/cache/EntitlementCacheService';
import { truethy } from '../../utils/booleanUtils';
import { UserCancelledError } from '../../errors';
import { stringToAttributeMetadata } from '../../utils/metadataUtils';
import { stringToDimensionAttributes } from '../../utils/dimensionUtils';
import { ImportResult } from '../../models/ImportResult';

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
    entitlements: string
    membershipCriteria: string
    dimensional?: boolean
    dimensionAttributes?: string
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
        private fileUri: vscode.Uri,
        private mode: ImportModeType
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

        const result: ImportResult = {
            success: 0,
            error: 0
        };

        const governanceGroupCache = new GovernanceGroupNameToIdCacheService(this.client);
        const workflowCache = new WorkflowNameToIdCacheService(this.client);
        await workflowCache.init()
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
                            .map(async (entitlementStr) => {
                                const parts = entitlementStr.split(KEY_SEPARATOR);
                                let sourceName: string;
                                let entitlementName: string;
                                let sourceId: string;
                                let entitlementId: string;

                                if (parts.length === 3) {
                                    // New format: sourceName|attribute|name
                                    let attribute
                                    [sourceName, attribute, entitlementName] = parts;
                                    sourceId = await sourceCacheService.get(sourceName);
                                    entitlementId = await entitlementCacheService.get(
                                        [sourceId, attribute, entitlementName].join(KEY_SEPARATOR)
                                    );
                                } else if (parts.length === 2) {
                                    // Legacy format: sourceName|name
                                    [sourceName, entitlementName] = parts;
                                    sourceId = await sourceCacheService.get(sourceName);
                                    entitlementId = await entitlementCacheService.get(
                                        [sourceId, entitlementName].join(KEY_SEPARATOR)
                                    );
                                } else {
                                    throw new Error(`Invalid entitlement format: ${entitlementStr}`);
                                }

                                return {
                                    name: entitlementName,
                                    id: entitlementId,
                                    type: "ENTITLEMENT"
                                }
                            }));
                    } catch (error) {
                        result.error++;
                        const etMessage = `Unable to find an entitlement: ${error}`;
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
                        data.approvalSchemes, governanceGroupCache, workflowCache);
                    revokeApprovalSchemes = await stringToRoleApprovalSchemeConverter(
                        data.revokeApprovalSchemes, governanceGroupCache, workflowCache);
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
                const description = data.description

                const rolePayload: RoleV2025 = {
                    "name": roleName,
                    description,
                    "enabled": truethy(data.enabled),
                    requestable: truethy(data.requestable),
                    "owner": {
                        "id": ownerId,
                        "type": "IDENTITY",
                        "name": data.owner
                    },
                    "accessRequestConfig": {
                        "commentsRequired": truethy(data.commentsRequired),
                        "denialCommentsRequired": truethy(data.denialCommentsRequired),
                        "approvalSchemes": approvalSchemes,
                        dimensionSchema: stringToDimensionAttributes(data.dimensionAttributes)
                    },
                    "revocationRequestConfig": {
                        "commentsRequired": truethy(data.revokeCommentsRequired),
                        "denialCommentsRequired": truethy(data.revokeDenialCommentsRequired),
                        "approvalSchemes": revokeApprovalSchemes
                    },
                    accessProfiles,
                    entitlements,
                    membership,
                    dimensional: truethy(data.dimensional),
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
                    const isConflict = error.message?.endsWith("already exists.")
                    if (isConflict && this.mode === importMode.createOrUpdate) {
                        console.log(`Role ${roleName} already exists. Try to update...`);

                        // Try to get the id
                        const role = await this.client.getRoleByName(roleName);
                        if (role) {

                            const updates = [
                                {
                                    "property": "description",
                                    "value": description
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
                                    "property": "dimensional",
                                    "value": truethy(data.dimensional)
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
                                        "approvalSchemes": approvalSchemes,
                                        "dimensionSchema": stringToDimensionAttributes(data.dimensionAttributes)
                                    }
                                },
                                {
                                    "property": "revocationRequestConfig",
                                    "value": {
                                        "commentsRequired": truethy(data.revokeCommentsRequired),
                                        "denialCommentsRequired": truethy(data.revokeDenialCommentsRequired),
                                        "approvalSchemes": revokeApprovalSchemes
                                    }
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
                                await this.client.updateRole(role.id, updates)
                                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.SUCCESS, `Successfully updated access profile '${roleName}'`);
                                result.success++;
                            } catch (error) {
                                result.error++;
                                await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot update role: '${error.message}'`);

                            }

                        } else {
                            // Role not found
                            // very unlikely. We shall find the role as we have a conflicting name
                            result.error++;
                            await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot update role: '${roleName}' not found.`);
                        }

                    } else if (isConflict && this.mode === importMode.createOnly) {
                        result.error++;
                        await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot create role: '${roleName}' already exists.`);

                    } else {
                        result.error++;
                        await this.writeLog(processedLines, roleName, CSVLogWriterLogType.ERROR, `Cannot create role: '${error.message}'`);
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

        console.log("Governance Group Cache stats", governanceGroupCache.getStats());
        governanceGroupCache.flushAll();
        console.log("Workflow Cache stats", workflowCache.getStats());
        workflowCache.flushAll();
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