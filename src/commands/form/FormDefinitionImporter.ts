import * as fs from 'fs';
import * as vscode from 'vscode';

import { IdentityNowClient } from "../../services/IdentityNowClient";

export class FormDefinitionImporter {
    readonly client: IdentityNowClient;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing forms to ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> FormDefinitionImporter.importFile");
        const data = fs.readFileSync(this.fileUri.fsPath).toString();
        const result = await this.client.importForms(JSON.parse(data))

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
            const message = "Sucessfully imported forms: " +
                result.importedObjects?.map(o => (o as any).name!).join(", ")
            vscode.window.showInformationMessage(message);
        }

    }




}