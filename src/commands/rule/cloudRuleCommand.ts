import * as fs from 'fs';
import * as vscode from 'vscode';
import { join } from 'path';
import { ImportOptionsBetaIncludeTypesBeta } from 'sailpoint-api-client';
import { CloudRuleTreeItem, CloudRulesTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { TenantService } from '../../services/TenantService';
import { toDateSuffix } from '../../utils';
import { ensureFolderExists } from '../../utils/fileutils';
import { chooseFile, confirmFileOverwrite, openPreview } from '../../utils/vsCodeHelpers';
import { validateTenantReadonly } from '../validateTenantReadonly';
import { SPConfigImporter } from '../spconfig-import/SPConfigImporter';
import * as commands from '../constants';

export class CloudRuleCommand {

    constructor(private readonly tenantService: TenantService) { }

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

    async importConfig(node: CloudRulesTreeItem): Promise<void> {
        console.log("> CloudRuleCommand.importConfig");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import cloud rules`))) {
            return;
        }

        const fileUri = await chooseFile('JSON', 'json');
        if (fileUri === undefined) { return; }

        const spConfig = JSON.parse(fs.readFileSync(fileUri.fsPath).toString());
        const ruleObjects = (spConfig.objects ?? []).filter((x: any) => x.self?.type === 'RULE');
        if (ruleObjects.length === 0) {
            vscode.window.showErrorMessage('No RULE objects found in the selected file.');
            return;
        }

        const importer = new SPConfigImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            { includeTypes: [ImportOptionsBetaIncludeTypesBeta.Rule] },
            JSON.stringify({ ...spConfig, objects: ruleObjects })
        );
        await importer.importConfig();

        CloudRuleService.getInstance(node.tenantId, node.tenantName, node.tenantDisplayName).resetCache();
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
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
