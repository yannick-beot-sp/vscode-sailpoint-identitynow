import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CloudRuleTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { PathProposer } from '../../services/PathProposer';
import { ensureFolderExists } from '../../utils/fileutils';
import {
    CLOUD_RULE_XML_TYPES,
    DEFAULT_RULE_XML_DESCRIPTION,
    buildRuleXml,
} from '../../utils/ruleXml';
import { askFile, openPreview } from '../../utils/vsCodeHelpers';

export class ExportRuleXmlCommand {

    async exportXmlView(node?: CloudRuleTreeItem): Promise<void> {
        if (node === undefined || !(node instanceof CloudRuleTreeItem)) {
            console.log('WARNING: exportXmlView: invalid item', node);
            throw new Error('exportXmlView: invalid item');
        }

        const exportFile = PathProposer.getCloudRuleXmlFilename(
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
        const xml = buildRuleXml(cloudRuleService.getRuleXmlFields(configObject));
        await this.writeXml(target, xml);
        vscode.window.showInformationMessage(`Successfully exported ${node.label} as XML`);
    }

    async exportXmlFromFile(fileUri?: vscode.Uri): Promise<void> {
        const sourceUri = fileUri ?? vscode.window.activeTextEditor?.document.uri;
        if (!sourceUri) {
            vscode.window.showErrorMessage('No Java or BeanShell file selected');
            return;
        }

        const parsed = path.parse(sourceUri.fsPath);
        const proposedFile = path.join(parsed.dir, `${parsed.name}.xml`);
        const target = await askFile(
            'Enter the file to save the XML to',
            proposedFile
        );
        if (target === undefined) {
            return;
        }

        const ruleType = await vscode.window.showQuickPick(CLOUD_RULE_XML_TYPES, {
            ignoreFocusOut: true,
            canPickMany: false,
            title: 'Export rule as XML',
            placeHolder: 'Choose one rule type',
        });
        if (!ruleType) {
            return;
        }

        const xml = buildRuleXml({
            name: parsed.name,
            type: ruleType,
            description: DEFAULT_RULE_XML_DESCRIPTION,
            source: this.readSource(sourceUri),
        });
        await this.writeXml(target, xml);
        vscode.window.showInformationMessage(`Successfully exported ${parsed.name} as XML`);
    }

    private readSource(uri: vscode.Uri): string {
        const openDocument = vscode.workspace.textDocuments.find(
            (document) => document.uri.toString() === uri.toString()
        );
        if (openDocument) {
            return openDocument.getText();
        }
        return fs.readFileSync(uri.fsPath, { encoding: 'utf8' });
    }

    private async writeXml(target: string, xml: string): Promise<void> {
        await ensureFolderExists(target);
        fs.writeFileSync(target, xml, { encoding: 'utf8' });
        await openPreview(target, 'xml');
    }
}
