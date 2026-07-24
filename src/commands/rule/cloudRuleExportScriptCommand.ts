import * as fs from 'fs';
import { join } from 'path';
import * as vscode from 'vscode';
import { CloudRuleTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { toDateSuffix } from '../../utils';
import { ensureFolderExists } from '../../utils/fileutils';
import { confirmFileOverwrite, openPreview } from '../../utils/vsCodeHelpers';

export class CloudRuleExportScriptCommand {
    public async exportScriptView(node?: CloudRuleTreeItem): Promise<void> {
        if (node === undefined || !(node instanceof CloudRuleTreeItem)) {
            throw new Error('CloudRuleExportScriptCommand: invalid item');
        }

        await this.exportScript(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string
        );
    }

    private buildProposedFilePath(tenantName: string, ruleName: string): string {
        if (vscode.workspace.workspaceFolders === undefined) {
            return '';
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath.replace(/\\/g, "/");
        const exportFolder = join(workspaceFolder, 'exportedObjects', 'cloud-rule-scripts');
        return join(exportFolder, `script-${tenantName}-${ruleName}-${toDateSuffix()}.bsh`);
    }

    private async chooseFileForExport(proposedFile: string): Promise<string | undefined> {
        const exportFile = await vscode.window.showInputBox({
            ignoreFocusOut: true,
            value: proposedFile,
            prompt: 'Enter the file to save the script to'
        });

        if (!exportFile) {
            return undefined;
        }

        const overwrite = await confirmFileOverwrite(exportFile);
        return overwrite ? exportFile : undefined;
    }

    private async exportScript(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        ruleName: string,
        ruleId: string
    ): Promise<void> {
        let exportFile = this.buildProposedFilePath(tenantName, ruleName);
        exportFile = await this.chooseFileForExport(exportFile) ?? '';
        if (!exportFile) {
            return;
        }

        ensureFolderExists(exportFile);
        const cloudRuleService = CloudRuleService.getInstance(tenantId, tenantName, tenantDisplayName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting script from cloud rule ${ruleName}...`,
            cancellable: true
        }, async (_task, token) => {
            if (token.isCancellationRequested) {
                return;
            }

            const configObject = await cloudRuleService.getCloudRule({ id: ruleId, name: ruleName });
            const script = cloudRuleService.getScriptFromConfigObject(configObject);
            fs.writeFileSync(exportFile, script, { encoding: 'utf8' });
            openPreview(exportFile, 'java');
            vscode.window.showInformationMessage(`Successfully exported script from cloud rule ${ruleName}`);
        });
    }
}
