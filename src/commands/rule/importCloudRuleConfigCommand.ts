import * as fs from 'fs';
import * as vscode from 'vscode';
import { ImportOptionsBetaIncludeTypesBeta } from 'sailpoint-api-client';
import { CloudRulesTreeItem } from '../../models/ISCTreeItem';
import { CloudRuleService } from '../../services/CloudRuleService';
import { TenantService } from '../../services/TenantService';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { validateTenantReadonly } from '../validateTenantReadonly';
import { SPConfigImporter } from '../spconfig-import/SPConfigImporter';
import * as commands from '../constants';

/**
 * Import SP-Config cloud rules from the Cloud Rules folder context menu.
 */
export class ImportCloudRuleConfigCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: CloudRulesTreeItem): Promise<void> {
        if (node === undefined || !(node instanceof CloudRulesTreeItem)) {
            throw new Error('ImportCloudRuleConfigCommand: invalid item');
        }

        if (!(await validateTenantReadonly(
            this.tenantService,
            node.tenantId,
            `import cloud rules in ${node.tenantName}`
        ))) {
            return;
        }

        const fileUri = await chooseFile('JSON files', 'json');
        if (fileUri === undefined) {
            return;
        }

        const rawData = fs.readFileSync(fileUri.fsPath).toString();
        const spConfig = JSON.parse(rawData);
        const ruleObjects = (spConfig.objects ?? []).filter((entry: any) => entry.self?.type === 'RULE');

        if (ruleObjects.length === 0) {
            vscode.window.showInformationMessage('No cloud rules found in the selected SP-Config file.');
            return;
        }

        const importData = JSON.stringify({ objects: ruleObjects });
        const importer = new SPConfigImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            { includeTypes: [ImportOptionsBetaIncludeTypesBeta.Rule] },
            importData
        );

        await importer.importConfig();
        CloudRuleService.getInstance(node.tenantId, node.tenantName, node.tenantDisplayName).resetCache();
        vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
    }
}
