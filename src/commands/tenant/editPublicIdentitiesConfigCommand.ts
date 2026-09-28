import { TenantTreeItem } from "../../models/ISCTreeItem.js";
import * as vscode from 'vscode';
import { getResourceUri } from "../../utils/UriUtils.js";
import { openPreview } from "../../utils/vsCodeHelpers.js";

export class EditPublicIdentitiesConfigCommand {

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> EditPublicIdentitiesConfigCommand.execute", node);

        const publicIdentitiesConfigUri = getResourceUri(node.tenantName,
            'public-identities-config',
            null,
            "Public Identities Configuration");


        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Public Identities Configuration...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(publicIdentitiesConfigUri)
        });

    }

}