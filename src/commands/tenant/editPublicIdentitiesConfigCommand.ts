import { TenantTreeItem } from "../../models/IdentityNowTreeItem";
import * as vscode from 'vscode';
import { getResourceUri } from "../../utils/UriUtils";
import { openPreview } from "../../utils/vsCodeHelpers";

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