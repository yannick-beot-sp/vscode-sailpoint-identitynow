import * as vscode from 'vscode';
import { IdentityProfileTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';


export async function refreshIdentityProfile(node?: IdentityProfileTreeItem): Promise<void> {

    console.log("> refreshIdentityProfile", node);
    // assessing that item is a IdentityProfileTreeItem
    if (node === undefined || !(node instanceof IdentityProfileTreeItem)) {
        console.log("WARNING: refreshIdentityProfile: invalid item", node);
        throw new Error("refreshIdentityProfile: invalid item");
    }


    const client = new IdentityNowClient(node.tenantId, node.tenantName);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Refreshing ${node.label}...`,
        cancellable: false
    }, async (task, token) => {
        await client.refreshIdentityProfile(node.id as string);
    }).then(async () =>
        await vscode.window.showInformationMessage(`Successfully refreshed ${node.label}`));

}