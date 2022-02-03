import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem } from "../models/IdentityNowTreeItem";

/**
 * Command used to open a source or a transform
 */
export class OpenResourceCommand {

    async execute(node?: IdentityNowResourceTreeItem, nodes?: IdentityNowResourceTreeItem[]): Promise<void> {

        console.log("> OpenResourceCommand.execute", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof IdentityNowResourceTreeItem)) {
            console.log("WARNING: OpenResourceCommand: invalid item", node);
            throw new Error("OpenResourceCommand: invalid item");
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening File(s)...',
            cancellable: false
        }, async (task, token) => {

            let document = await vscode.workspace.openTextDocument(node.uri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');

            if (token.isCancellationRequested) {
                return;
            }
            await vscode.window.showTextDocument(document, { preview: true });
        });
    }
}
