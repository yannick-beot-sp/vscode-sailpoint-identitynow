import * as path from 'path';
import * as vscode from 'vscode';
import { MachineAccountSubtypeTreeItem } from "../../models/ISCTreeItem.js";
import { getPathByUri } from "../../utils/UriUtils.js";
import { openPreview } from "../../utils/vsCodeHelpers.js";

export class EditMachineAccountSubtypeApprovalConfigCommand {

    async execute(node: MachineAccountSubtypeTreeItem): Promise<void> {
        console.log("> EditMachineAccountSubtypeApprovalConfigCommand.execute", node);

        const approvalConfigUri = node.uri.with({
            path: path.posix.join(getPathByUri(node.uri) || "", "machine-config", "Approval Configuration")
        });

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Approval Configuration...',
            cancellable: false
        }, async (task, token) => {
            await openPreview(approvalConfigUri)
        });
    }
}
