import * as vscode from 'vscode';
import * as commands from './constants';
import { ISCResourceTreeItem } from '../models/ISCTreeItem';
import { ISCClient } from '../services/ISCClient';
import { getPathByUri } from '../utils/UriUtils';


export async function deleteResource(node: ISCResourceTreeItem): Promise<void> {

    console.log("> deleteResource", node);

    const response = await vscode.window.showWarningMessage(
        `Are you sure you want to delete ${node.contextValue} ${node.label}?`,
        { modal: true },
        ...["Yes", "No"]
    );
    if (response !== "Yes") {
        console.log("< deleteResource: no delete");
        return;
    }

    const client = new ISCClient(node.tenantId, node.tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Deleting ${node.contextValue}...`,
        cancellable: false
    }, async (task, token) => {
        await client.deleteResource(getPathByUri(node.uri) || "");
    }).then(() => {
        vscode.window.showInformationMessage(`Successfully deleted ${node.contextValue} ${node.label}`);
        vscode.commands.executeCommand(commands.REFRESH_FORCED);
    });

}