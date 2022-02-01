import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem } from "../models/IdentityNowTreeItem";
import { getCancelPromise } from '../utils/PromiseUtils';

export class OpenSourceCommand {



    async execute(node?: IdentityNowResourceTreeItem, nodes?: IdentityNowResourceTreeItem[]): Promise<void> {

        console.log("> OpenSourceCommand.execute", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof IdentityNowResourceTreeItem)) {
            console.log("WARNING: OpenSourceCommand: invalid item", node);
            throw new Error("OpenSourceCommand: invalid item");
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
