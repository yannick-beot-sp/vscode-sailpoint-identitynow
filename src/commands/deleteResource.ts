import * as vscode from 'vscode';
import * as commands from './constants';
import { IdentityNowResourceTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { getPathByUri } from '../utils/UriUtils';


export async function deleteResource(node: IdentityNowResourceTreeItem): Promise<void> {

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

    const client = new IdentityNowClient(node.tenantId, node.tenantName);
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