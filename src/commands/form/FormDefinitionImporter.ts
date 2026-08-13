import * as fs from 'fs';
import * as vscode from 'vscode';
import * as commands from '../constants';

import { ISCClient } from "../../services/ISCClient";
import { askChosenItems } from '../../utils/vsCodeHelpers';
import { ImportFormDefinitionsRequestInnerBeta } from 'sailpoint-api-client';

export class FormDefinitionImporter {
    readonly client: ISCClient;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);
    }

    async chooseAndImport(): Promise<void> {
        console.log("> FormDefinitionImporter.chooseAndImport");
        const data = fs.readFileSync(this.fileUri.fsPath).toString();
        let json = JSON.parse(data) as ImportFormDefinitionsRequestInnerBeta[]
        // Cleaning "data" by removing usedBy
        const pickItems = json.map(item => ({
            ...item,
            object: {
                ...item.object,
                usedBy: []
            }
        })).map(x => ({
            ...x,
            id: x.object.id,
            name: x.object.name,
            description: x.object.description
        }))

        const items = await askChosenItems("Importing forms", "Forms", pickItems, x => {
            const { id, name, description, ...rest } = x;
            return rest;
        })

        if (items === undefined) {
            return
        }
        await this.importFileWithProgression(items);
    }

    protected async importFileWithProgression(data: ImportFormDefinitionsRequestInnerBeta[]): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing forms to ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(data, task, token)
        );
    }

    protected async importFile(forms: ImportFormDefinitionsRequestInnerBeta[], task: any, token: vscode.CancellationToken): Promise<void> {
        const result = await this.client.importForms(forms)

        if (result.errors !== undefined && result.errors.length > 0) {
            const message = "Errors during form import: " +
                result.errors.map(e => e.text ?? e.detail).join(", ")
            vscode.window.showErrorMessage(message);

        } else if (result.warnings !== undefined && result.warnings.length > 0) {
            const message = "Warnings during form import: " +
                result.warnings.map(e => e.text ?? e.detail).join(", ")
            vscode.window.showWarningMessage(message);

        } else {
            // FIXME forced cast to any because of https://github.com/sailpoint-oss/api-specs/issues/60
            const message = "Successfully imported forms: " +
                result.importedObjects?.map(o => (o as any).name!).join(", ")
            vscode.window.showInformationMessage(message);
        }
        vscode.commands.executeCommand(commands.REFRESH_FORCED);

    }

}