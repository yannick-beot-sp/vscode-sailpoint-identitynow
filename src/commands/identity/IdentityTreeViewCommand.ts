import * as vscode from 'vscode';

import { IdentitiesTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';

export class IdentityTreeViewCommand {

    constructor() { }

    async deleteIdentity(identityTreeItem?: IdentitiesTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.deleteIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        vscode.window
            .showInformationMessage(`Are you sure you want to delete ${identityTreeItem.label}?`, "Yes", "No")
            .then(async (answer) => {
                if (answer === "Yes") {
                    const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
                    await client.deleteIdentity(identityTreeItem.id);
                    vscode.window.showInformationMessage("Identity Delete started");
                }
            })
    }

    async attSyncIdentity(identityTreeItem?: IdentitiesTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.attSyncIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        await client.syncIdentityAttributes(identityTreeItem.id);

        vscode.window.showInformationMessage("Identity Att Sync started");
    }

    async processIdentity(identityTreeItem?: IdentitiesTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.processIdentity");

        if (identityTreeItem === undefined) {
            return;
        }

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        await client.processIdentity(identityTreeItem.id);

        vscode.window.showInformationMessage("Identity process started");
    }
}