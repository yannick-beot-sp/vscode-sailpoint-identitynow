import * as vscode from 'vscode';
import { SourceTreeItem } from "../../models/IdentityNowTreeItem";
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { CSVReader } from '../../services/CSVReader';
import { isNotEmpty } from '../../utils/stringUtils';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { JsonPatchOperationBeta } from 'sailpoint-api-client';

// List of mandatory headers to update the description of entitlements
const mandatoryHeadersDescription = ["attributeName", "attributeValue", "displayName", "description", "schema"];
const mandatoryHeadersOthers = ["attributeName", "attributeValue", "schema"];
const optionalHeadersOthers = ["requestable", "owner", "privileged"];


interface UncorrelatedAccountImportResult {
    totalDescription: number
    totalDescriptionUpdated: number
    totalDescriptionSaved: number
    emptyEntitlement: number
    noMetadataUpdate: number
    identityNotFound: number
    entitlementNotFound: number
    metadataUpdated: number
    error: number
}

class EntitlementDetailsImporter {
    readonly client: IdentityNowClient;
    readonly csvReader: CSVReader<any>;
    readonly result: UncorrelatedAccountImportResult = {
        totalDescription: 0,
        totalDescriptionUpdated: 0,
        totalDescriptionSaved: 0,
        emptyEntitlement: 0,
        noMetadataUpdate: 0,
        identityNotFound: 0,
        entitlementNotFound: 0,
        metadataUpdated: 0,
        error: 0,
    };

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private sourceName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
        this.csvReader = new CSVReader<any>(this.fileUri.fsPath);
    }

    public async importFileWithProgression(): Promise<void> {
        const headers = await this.csvReader.getHeaders();

        const updateDescription = mandatoryHeadersDescription.every((element) => {
            return headers.includes(element);
        });
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

        let updateOthersMetadata = mandatoryHeadersOthers.every(element => {
            return headers.includes(element);
        });

        updateOthersMetadata = updateOthersMetadata && optionalHeadersOthers.some(element => {
            return headers.includes(element);
        });

        if (updateOthersMetadata) {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Importing entitlement metadata for ${this.sourceName}...`,
                cancellable: true
            }, async (task, token) => await this.importMetadata(task, token))
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
    }

    private async importDescription(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> EntitlementDetailsImporter.importDescription");
        const result = await this.client.importEntitlements(this.sourceId, this.fileUri.fsPath);
        this.result.totalDescription = result.total;
        this.result.totalDescriptionUpdated = result.updated;
        this.result.totalDescriptionSaved = result.saved;

    }

    private async importMetadata(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> EntitlementDetailsImporter.importDescription");


        const nbLines = await this.csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        await this.csvReader.processLine(async (data: any) => {
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.attributeValue });
            if (!mandatoryHeadersOthers.every(p => isNotEmpty(data[p]))) {
                this.result.emptyEntitlement++;
                return;
            }

            const response = await this.client.getEntitlements({
                filters: `source.id eq "${this.sourceId}" and attribute eq "${data.attributeName}" and value eq "${data.attributeValue}" and type eq "${data.schema}"`
            });

            const entitlements = response.data;
            if (!Array.isArray(entitlements) || entitlements.length !== 1) {
                this.result.entitlementNotFound++;
                return;
            }
            const entitlement = entitlements[0];

            const payload : JsonPatchOperationBeta[] = [];

            if (isNotEmpty(data.requestable)) {
                payload.push({
                    "op": "replace",
                    "path": "/requestable",
                    //@ts-ignore cf. https://github.com/sailpoint-oss/typescript-sdk/issues/18
                    "value": ("TRUE" === data.requestable.toUpperCase())
                });
            }
            if (isNotEmpty(data.privileged)) {
                payload.push({
                    "op": "replace",
                    "path": "/privileged",
                    //@ts-ignore cf. https://github.com/sailpoint-oss/typescript-sdk/issues/18
                    "value": ("TRUE" === data.privileged.toUpperCase())
                });
            }
            if (isNotEmpty(data.owner)) {
                if (/^[a-f0-9]{32}$/.test(data.owner)) {
                    // is id
                    payload.push({
                        "op": "replace",
                        "path": "/owner",
                        "value": {
                            "type": "IDENTITY",
                            "id": data.owner
                        }
                    });
                } else {
                    // need to get id 
                    try {
                        const ownerIdentity = await this.client.getPublicIdentityByAlias(data.owner);

                        payload.push({
                            "op": "replace",
                            "path": "/owner",
                            "value": {
                                "type": "IDENTITY",
                                "id": ownerIdentity.id
                            }
                        });
                    } catch (error) {
                        console.error(error);
                        this.result.identityNotFound++;
                    }
                }
            }

            if (payload.length === 0) {
                this.result.noMetadataUpdate++;
                return;
            }
            try {
                await this.client.updateEntitlement(entitlement.id!, payload);
                this.result.metadataUpdated++;
            } catch (error) {
                this.result.error++;
                console.error(error);
            }

        });
    }
}

/**
 * Entrypoint for the command to import accounts from the tree view/from a node
 */
export class EntitlementDetailsImportNodeCommand {

    async execute(node?: SourceTreeItem): Promise<void> {
        console.log("> EntitlementDetailsImportNodeCommand.execute");
        if (node === undefined) {
            console.error("EntitlementDetailsImportNodeCommand: invalid item", node);
            throw new Error("EntitlementDetailsImportNodeCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const entitlementImporter = new EntitlementDetailsImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            node.ccId,
            fileUri
        );
        await entitlementImporter.importFileWithProgression();
    }
}