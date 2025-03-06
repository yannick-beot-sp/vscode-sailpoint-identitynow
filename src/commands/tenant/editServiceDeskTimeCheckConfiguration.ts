import { TenantTreeItem } from "../../models/ISCTreeItem";
import * as vscode from 'vscode';
import { buildResourceUri } from "../../utils/UriUtils";
import { openPreview } from "../../utils/vsCodeHelpers";

export class EditServiceDeskTimeCheckConfiguration {

    async execute(node: TenantTreeItem): Promise<void> {
        console.log("> EditServiceDeskTimeCheckConfiguration.execute", node);

        const timeCheckConfigurationUri = buildResourceUri({
            tenantName: node.tenantName,
            resourceType: 'service-desk-integrations',
            id: "status-check-configuration",
            name: "Time Check Configuration"
        });


        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Time Check Configuration...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(timeCheckConfigurationUri)
        });

    }

}