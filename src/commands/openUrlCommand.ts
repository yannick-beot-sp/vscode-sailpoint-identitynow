import * as vscode from 'vscode';
import { ISCResourceTreeItem } from "../models/ISCTreeItem";

/**
 * Command used to open the URL
 */
export class OpenUrlCommand {

    async execute(node?: ISCResourceTreeItem): Promise<void> {

        console.log("> OpenUrlCommand.execute", node);
        const url = node.getUrl();
        if (url) {
            vscode.env.openExternal(url);
        }
    }
}
