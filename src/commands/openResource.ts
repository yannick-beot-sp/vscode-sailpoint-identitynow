import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem } from "../models/IdentityNowTreeItem";
import { openPreview } from '../utils/vsCodeHelpers';

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
            await openPreview(node.uri)
        });
    }
}
