import { TenantTreeItem } from "../../models/ISCTreeItem.js";
import * as vscode from 'vscode';
import { getResourceUri } from "../../utils/UriUtils.js";
import { openPreview } from "../../utils/vsCodeHelpers.js";

export class EditAccessRequestConfigCommand {

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> EditAccessRequestConfigCommand.execute", node);

        const accessRequestConfigUri = getResourceUri(node.tenantName,
            'access-request-config',
            null,
            "Access Request Configuration");

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Access Request Configuration...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(accessRequestConfigUri)
        });
    }
}