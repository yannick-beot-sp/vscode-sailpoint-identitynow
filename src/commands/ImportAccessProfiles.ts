import * as vscode from 'vscode';
import { IdentityNowClient } from "../services/IdentityNowClient";
import { isEmpty } from 'lodash';
import { GenericCSVReader } from '../services/GenericCSVReader';
import { chooseFile } from '../utils/vsCodeHelpers';
import { AccessProfilesTreeItem } from '../models/IdentityNowTreeItem';

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
}

export class AccessProfileImporterCommand {

    async execute(node?: AccessProfilesTreeItem): Promise<void> {
        console.log("> AccessProfileImporterCommand.execute");
        if (node === undefined) {
            console.error("AccessProfileImporterCommand: invalid item", node);
            throw new Error("AccessProfileImporterCommand: invalid item");
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined ) { return; }

        const accessProfileImporter = new AccessProfileImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            0,
            fileUri
        );
        await accessProfileImporter.importFileWithProgression();
    }
}

export class AccessProfileImporter {
    readonly client: IdentityNowClient;
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
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing access profiles to ${this.sourceName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccessProfileImporter.importFile");
        const csvReader = new GenericCSVReader(this.fileUri.fsPath);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: AccessProfileImportResult = {
            success: 0,
            error: 0
        };

        // Get the Sources to use for lookup of Id
        const sources = await this.client.getSources();

        await csvReader.processLine(async (data: AccessProfileCSVRecord) => {
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

            if (isEmpty(data.source)) {
                result.error++;
                // console.log('Missing source in file');
                return;
            }

            if (isEmpty(data.owner)) {
                result.error++;
                // console.log('Missing owner in file');
                return;
            }

            // Enrich source Id
            const sourceId = this.lookupSourceId(sources, data.source);
            if (isEmpty(sourceId)) {
                result.error++;
                return;
            }

            // Enrich Owner Id
            const owner = await this.client.getIdentity(data.owner);
            const ownerId = owner.id;
            if (isEmpty(ownerId)) {
                result.error++;
                return;
            }

            const accessProfilePayload = {
                "name": data.name,
                "description": "", // need to add description at some point
                "enabled": data.enabled,
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
                "entitlements": [],
                // "requestable": data.requestable
            };

            // console.log(JSON.stringify(accessProfilePayload));

            try {
                await this.client.createResource('/v3/access-profiles', JSON.stringify(accessProfilePayload));
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

    protected lookupSourceId(sources: any, sourceName: string) {
        if (sources !== undefined && sources instanceof Array) {
			for (let source of sources) {
                // console.log(`${source.name} === ${sourceName}`)
                if (source.name.trim() === sourceName.trim()) {
                    // console.log('Found the right one!')
                    return source.id;
                }
            }
        }
        throw new Error('AccessProfileImporter: Unable to retrieve sources');
    }
}