import * as vscode from 'vscode';
import { IdentityNowClient } from "../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../services/GenericCSVReader';
import { chooseFile } from '../utils/vsCodeHelpers';
import { RolesTreeItem } from '../models/IdentityNowTreeItem';

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
}

export class RoleImporterCommand {

    async execute(node?: RolesTreeItem): Promise<void> {
        console.log("> RoleImporterCommand.execute");
        if (node === undefined) {
            console.error("RoleImporterCommand: invalid item", node);
            throw new Error("RoleImporterCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            0,
            fileUri
        );
        await roleImporter.importFileWithProgression();
    }
}

export class RoleImporter {
    readonly client: IdentityNowClient;
    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private roleName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing roles to ${this.roleName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleImporter.importFile");
        const csvReader = new GenericCSVReader(this.fileUri.fsPath);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: RolesImportResult = {
            success: 0,
            error: 0
        };

        await csvReader.processLine(async (data: RoleCSVRecord) => {
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.name });
            if (isEmpty(data.name)) {
                result.error++;
                // console.log('Missing name in file');
                return;
            }

            if (isEmpty(data.enabled)) {
                data.enabled = false;
            }

            if (isEmpty(data.requestable)) {
                data.requestable = false;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                // console.log('Missing owner in file');
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            const ownerId = owner.id;
            if (isEmpty(ownerId)) {
                result.error++;
                return;
            }

            const rolePayload = {
                "name": data.name,
                "description": "", // need to add description at some point
                "enabled": data.enabled,
                "owner": {
                    "id": ownerId,
                    "type": "IDENTITY",
                    "name": data.owner
                },
                // "requestable": data.requestable
            };

            console.log(JSON.stringify(rolePayload));

            try {
                await this.client.createResource('/v3/roles', JSON.stringify(rolePayload));
                result.success++;
            } catch (error) {
                result.error++;
                console.error(error);
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
    }
}