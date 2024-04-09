import * as vscode from 'vscode';
import { ISCResourceTreeItem } from "../models/ISCTreeItem";
import { openPreview } from '../utils/vsCodeHelpers';

/**
 * Command used to open a source or a transform
 */
export class OpenResourceCommand {

    async execute(node?: ISCResourceTreeItem, nodes?: ISCResourceTreeItem[]): Promise<void> {

        console.log("> OpenResourceCommand.execute", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof ISCResourceTreeItem)) {
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
