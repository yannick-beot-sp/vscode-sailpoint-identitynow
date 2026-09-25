import * as fs from 'fs';
import * as vscode from 'vscode';
import { CloudRuleTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { PathProposer } from '../../services/PathProposer';
import { ensureFolderExists } from '../../utils/fileutils';
import { askFile, openPreview } from '../../utils/vsCodeHelpers';

export class CloudRuleCommand {

    async openScript(node?: CloudRuleTreeItem): Promise<void> {
        console.log("> CloudRuleCommand.openScript", node);
        const newPath = node!.uri.path.replace("/cloud-rules/", "/cloud-rule-script/");
        const newUri = node!.uri.with({ path: newPath });
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Opening Rule...',
            cancellable: false
        }, async () => {
            await openPreview(newUri, 'java');
        });
    }

    async exportScriptView(node?: CloudRuleTreeItem): Promise<void> {
        if (node === undefined || !(node instanceof CloudRuleTreeItem)) {
            console.log("WARNING: exportScriptView: invalid item", node);
            throw new Error("exportScriptView: invalid item");
        }

        const exportFile = PathProposer.getCloudRuleScriptFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        );
        const target = await askFile(
            `Enter the file to save ${node.label} to`,
            exportFile
        );
        if (target === undefined) {
            return;
        }

        const cloudRuleService = CloudRuleService.getInstance(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName
        );
        const configObject = await cloudRuleService.getCloudRule({
            id: node.id as string,
            name: node.label as string,
        });
        await ensureFolderExists(target);
        fs.writeFileSync(
            target,
            cloudRuleService.getScriptFromConfigObject(configObject),
            { encoding: "utf8" }
        );
        await openPreview(target, 'java');
        vscode.window.showInformationMessage(`Successfully exported script from rule ${node.label}`);
    }
}
