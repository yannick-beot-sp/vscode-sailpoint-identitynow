import * as fs from 'fs';
import * as vscode from 'vscode';
import { join } from 'path';
import { CloudRuleTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { toDateSuffix } from '../../utils';
import { ensureFolderExists } from '../../utils/fileutils';
import { confirmFileOverwrite, openPreview } from '../../utils/vsCodeHelpers';

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

        await this.exportScript(node.tenantId, node.tenantName, node.tenantDisplayName, node.label as string, node.id as string);
    }

    private buildProposedFilePath(tenantName: string, ruleName: string): string {
        if (vscode.workspace.workspaceFolders === undefined) {
            return '';
        }
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        const exportFolder = join(workspaceFolder, 'exportedObjects', 'cloud-rule-scripts');
        return join(exportFolder, 'script-' + tenantName + '-' + ruleName + '-' + toDateSuffix() + '.bsh');
    }

    private async chooseFileForExport(proposedFile: string): Promise<string | undefined> {
        const exportFile = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            value: proposedFile,
            prompt: 'Enter the file to save the script to'
        });
        if (exportFile && !(await confirmFileOverwrite(exportFile))) {
            return undefined;
        }
        return exportFile;
    }

    private async exportScript(tenantId: string, tenantName: string, tenantDisplayName: string, ruleName: string, ruleId: string): Promise<void> {
        let exportFile = await this.chooseFileForExport(this.buildProposedFilePath(tenantName, ruleName));
        if (!exportFile) {
            return;
        }

        ensureFolderExists(exportFile);

        const cloudRuleService = CloudRuleService.getInstance(tenantId, tenantName, tenantDisplayName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting script from rule ${ruleName}...`,
            cancellable: true
        }, async (_task, token) => {
            const configObject = await cloudRuleService.getCloudRule({ id: ruleId, name: ruleName });
            if (token.isCancellationRequested) {
                return;
            }
            fs.writeFileSync(exportFile!, cloudRuleService.getScriptFromConfigObject(configObject), { encoding: "utf8" });
            openPreview(exportFile!, 'java');
            vscode.window.showInformationMessage(`Successfully exported script from rule ${ruleName}`);
        });
    }
}
