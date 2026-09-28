import { TenantTreeItem } from "../../models/ISCTreeItem.js";
import * as vscode from 'vscode';
import { getResourceUri } from "../../utils/UriUtils.js";
import { openPreview } from "../../utils/vsCodeHelpers.js";

export class EditPasswordConfigCommand {

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> EditPasswordConfigCommand.execute", node);

        const passwordOrgConfigUri = getResourceUri(node.tenantName,
            'password-org-config',
            null,
            "Password Org Config");

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Password Org Config...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(passwordOrgConfigUri)
        });
    }
}