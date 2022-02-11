import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { TransformsTreeItem } from "../models/IdentityNowTreeItem";
import { isEmpty } from '../utils';
import { getResourceUri } from '../utils/UriUtils';

/**
 * Command used to open a source or a transform
 */
export class NewTransformCommand {
    async askTransformName(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'Transform name',
            prompt: "Enter the transform name",
            title: 'IdentityNow',
            validateInput: text => {
                const regex = new RegExp('^[a-z0-9]+$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid transform name";
            }
        });
        return result;
    }

    async execute(tenant: TransformsTreeItem): Promise<void> {

        console.log("> NewTransformCommand.execute", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof TransformsTreeItem)) {
            console.log("WARNING: NewTransformCommand.execute: invalid node", tenant);
            throw new Error("NewTransformCommand.execute: invalid node");
        }
        const tenantName = tenant.tenantName || "";
        if (isEmpty(tenantName)) {
            return;
        }
        let transformName = await this.askTransformName() || "";
        if (isEmpty(transformName)) {
            return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {

            const newUri = getResourceUri(tenantName, 'transforms', NEW_ID, transformName);

            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');

            if (token.isCancellationRequested) {
                return;
            }
            await vscode.window.showTextDocument(document, { preview: true });

        });
    }
}
