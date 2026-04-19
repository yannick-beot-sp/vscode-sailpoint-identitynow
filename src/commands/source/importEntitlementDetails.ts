import * as vscode from 'vscode';
import * as tmp from "tmp";
import { SourceTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from '../../services/ISCClient';
import { CSVReader } from '../../services/CSVReader';
import { CSVLogWriter, CSVLogWriterLogType } from '../../services/CSVLogWriter';
import { isNotEmpty } from '../../utils/stringUtils';
import { chooseFile, openPreview } from '../../utils/vsCodeHelpers';
import { JsonPatchOperationBeta } from 'sailpoint-api-client';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';
import { IdentityUsernameToIdCacheService } from '../../services/cache/IdentityNameToIdCacheService';
import { truethy } from '../../utils/booleanUtils';
import { stringToAttributeMetadata } from '../../utils/metadataUtils';

const mandatoryHeadersDescription = ["attributeName", "attributeValue", "displayName", "description", "schema"];
const mandatoryHeadersOthers = ["attributeName", "attributeValue", "schema"];
const optionalHeadersOthers = ["requestable", "privileged", "owner", "metadata", "additionalOwners", "additionalOwnerGovernanceGroup"];

interface EntitlementCSVRecord {
    attributeName: string
    attributeValue: string
    schema: string
    displayName?: string
    description?: string
    requestable?: string
    privileged?: string
    owner?: string
    metadata?: string
    additionalOwners?: string
    additionalOwnerGovernanceGroup?: string
}

interface EntitlementDetailsImportResult {
    totalDescription: number
    totalDescriptionUpdated: number
    totalDescriptionSaved: number
    emptyEntitlement: number
    identityNotFound: number
    entitlementNotFound: number
    error: number
    metadataUpdated: number
    noMetadataUpdate: number
}

class EntitlementDetailsImporter {
    readonly client: ISCClient;
    readonly csvReader: CSVReader<EntitlementCSVRecord>;
    readonly identityCacheService: IdentityUsernameToIdCacheService;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;
    readonly result: EntitlementDetailsImportResult = {
        totalDescription: 0,
        totalDescriptionUpdated: 0,
        totalDescriptionSaved: 0,
        emptyEntitlement: 0,
        identityNotFound: 0,
        entitlementNotFound: 0,
        metadataUpdated: 0,
        noMetadataUpdate: 0,
        error: 0,
    };

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private sourceName: string,
        private sourceId: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);
        this.csvReader = new CSVReader<EntitlementCSVRecord>(this.fileUri.fsPath);
        this.identityCacheService = new IdentityUsernameToIdCacheService(this.client);

        this.logFilePath = tmp.tmpNameSync({
            prefix: 'import-entitlement-details',
            postfix: ".log",
        });

        try {
            this.logWriter = new CSVLogWriter(this.logFilePath);
        } catch (_exc: any) {
            console.error(_exc);
            throw _exc;
        }
    }

    public async importFileWithProgression(): Promise<void> {
        const headers = await this.csvReader.getHeaders();

        const updateDescription = mandatoryHeadersDescription.every(element => headers.includes(element));
        let message = '';

        if (updateDescription) {
            let inError = false;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Importing entitlement descriptions for ${this.sourceName}...`,
                cancellable: false
            }, async (task, token) => await this.importDescription(task, token))
                .then(() => { return; },
                    error => {
                        vscode.window.showErrorMessage(error.toString());
                        inError = true;
                    });

            if (inError) {
                return;
            }
            message = `${this.result.totalDescriptionUpdated} description(s) updated.`;
        }

        let updateOthersMetadata = mandatoryHeadersOthers.every(element => headers.includes(element));
        updateOthersMetadata = updateOthersMetadata && optionalHeadersOthers.some(element => headers.includes(element));

        if (updateOthersMetadata) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Importing entitlement metadata for ${this.sourceName}...`,
                cancellable: true
            }, async (task, token) => await this.importMetadata(task, token, headers))
                .then(() => { return; },
                    error => {
                        vscode.window.showErrorMessage(error.toString());
                    });
            message += ` ${this.result.metadataUpdated} metadata updated.`;
        }

        if (updateDescription || updateOthersMetadata) {
            if (this.result.error > 0) {
                message += ` ${this.result.error} error(s).`;
                vscode.window.showErrorMessage(message);
            } else if (this.result.emptyEntitlement > 0 || this.result.identityNotFound > 0 || this.result.entitlementNotFound > 0 || this.result.noMetadataUpdate > 0) {
                message += ` ${this.result.emptyEntitlement} empty entitlement(s). ${this.result.identityNotFound} identities not found. ${this.result.noMetadataUpdate} without any metadata update.`;
                vscode.window.showWarningMessage(message);
            } else {
                vscode.window.showInformationMessage(message);
            }
        } else {
            vscode.window.showWarningMessage("No update");
        }

        try {
            this.logWriter?.end();
        } catch (_exc) {
            // do nothing
        }

        console.log("Identity Cache stats", this.identityCacheService.getStats());
        this.identityCacheService.flushAll();

        await openPreview(this.logFilePath, "log");
    }

    private async importDescription(_task: any, _token: vscode.CancellationToken): Promise<void> {
        console.log("> EntitlementDetailsImporter.importDescription");
        const result = await this.client.importEntitlements(this.sourceId, this.fileUri.fsPath);
        this.result.totalDescription = result.total;
        this.result.totalDescriptionUpdated = result.updated;
        this.result.totalDescriptionSaved = result.saved;
    }

    private async importMetadata(task: any, token: vscode.CancellationToken, headers: string[]): Promise<void> {
        console.log("> EntitlementDetailsImporter.importMetadata");

        const nbLines = await this.csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        await this.csvReader.processLine(async (data: EntitlementCSVRecord) => {
            if (token.isCancellationRequested) {
                return;
            }
            task.report({ increment: incr, message: data.attributeValue });

            if (!mandatoryHeadersOthers.every(p => isNotEmpty(data[p as keyof EntitlementCSVRecord]))) {
                this.result.emptyEntitlement++;
                return;
            }

            const response = await this.client.getEntitlements({
                filters: `source.id eq "${this.sourceId}" and attribute eq "${data.attributeName}" and value eq "${data.attributeValue}" and type eq "${data.schema}"`
            });

            const entitlements = response.data;
            if (!Array.isArray(entitlements) || entitlements.length !== 1) {
                this.result.entitlementNotFound++;
                await this.writeLog(processedLines, data.attributeValue, CSVLogWriterLogType.WARNING, `Entitlement not found: ${data.attributeName}=${data.attributeValue} (schema: ${data.schema})`);
                return;
            }
            const entitlement = entitlements[0];

            let ownerId: string | undefined;
            if (headers.includes('owner') && isNotEmpty(data.owner)) {
                if (/^[a-f0-9]{32}$/.test(data.owner!)) {
                    ownerId = data.owner!;
                } else {
                    try {
                        ownerId = await this.identityCacheService.get(data.owner!);
                    } catch (error) {
                        this.result.identityNotFound++;
                        await this.writeLog(processedLines, data.attributeValue, CSVLogWriterLogType.ERROR, `Identity not found: ${data.owner}`);
                        return;
                    }
                }
            }

            const updateMappings: { columns: string[]; path: string; getValue: () => any; condition: () => boolean }[] = [
                { columns: ['displayName'], path: 'name', getValue: () => data.displayName, condition: () => isNotEmpty(data.displayName) },
                { columns: ['description'], path: 'description', getValue: () => data.description, condition: () => isNotEmpty(data.description) },
                { columns: ['requestable'], path: 'requestable', getValue: () => truethy(data.requestable), condition: () => isNotEmpty(data.requestable) },
                { columns: ['privileged'], path: 'privileged', getValue: () => truethy(data.privileged), condition: () => isNotEmpty(data.privileged) },
                { columns: ['owner'], path: 'owner', getValue: () => ({ type: "IDENTITY", id: ownerId }), condition: () => ownerId !== undefined },
                { columns: ['metadata'], path: 'accessModelMetadata', getValue: () => { attributes: stringToAttributeMetadata(data.metadata!) }, condition: () => isNotEmpty(data.metadata) },
            ];

            const payload: JsonPatchOperationBeta[] = updateMappings
                .filter(m => m.columns.some(col => headers.includes(col)) && m.condition())
                .map(m => ({
                    op: "replace" as const,
                    path: `/${m.path}`,
                    value: m.getValue()
                }));

            processedLines++;
            try {
                await this.client.updateEntitlement(entitlement.id!, payload);
                this.result.metadataUpdated++;
                await this.writeLog(processedLines, data.attributeValue, CSVLogWriterLogType.SUCCESS, `Successfully updated entitlement '${data.attributeValue}'`);
            } catch (error: any) {
                this.result.error++;
                await this.writeLog(processedLines, data.attributeValue, CSVLogWriterLogType.ERROR, `Cannot update entitlement: '${error.message}'`);
                console.error(error);
            }
        });
    }

    private async writeLog(csvLine: number | string | null, objectName: string, type: CSVLogWriterLogType, message: string) {
        if (this.logWriter) {
            if (!csvLine) {
                csvLine = '0';
            }
            const lnStr = '' + csvLine;
            const logMessage = `[CSV${lnStr.padStart(8, '0')}][${objectName}] ${message}`;
            await this.logWriter.writeLine(type, logMessage);
        }
    }
}

/**
 * Entrypoint for the command to import accounts from the tree view/from a node
 */
export class EntitlementDetailsImportNodeCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: SourceTreeItem): Promise<void> {
        console.log("> EntitlementDetailsImportNodeCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import entitlements details in ${node.label}`))) {
            return;
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const entitlementImporter = new EntitlementDetailsImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            fileUri
        );
        await entitlementImporter.importFileWithProgression();
    }
}
