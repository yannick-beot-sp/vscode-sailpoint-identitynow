import { TenantTreeItem } from "../../models/ISCTreeItem";
import * as vscode from 'vscode';
import { getResourceUri } from "../../utils/UriUtils";
import { openPreview } from "../../utils/vsCodeHelpers";

export class EditOrgConfigCommand {

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> EditOrgConfigCommand.execute", node);

        const orgConfigUri = getResourceUri(node.tenantName,
            'org-config',
            null,
            "Organization Configuration");


        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Organization Configuration...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(orgConfigUri)
        });

    }

}