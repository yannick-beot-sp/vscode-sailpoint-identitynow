import { chooseFile } from '../../utils/vsCodeHelpers.js';
import { WorkflowsTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { Workflow } from 'sailpoint-api-client/dist/workflows/api.js';
import { TenantService } from '../../services/TenantService.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';
import { createWorkflow } from './createWorkflow.js';

export class WorkflowImporterTreeViewCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node: WorkflowsTreeItem): Promise<void> {
        console.log("> WorkflowImporterTreeViewCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import workflow`))) {
            return
        }

        const fileUri = await chooseFile('JSON', 'json');
        if (fileUri === undefined) { return; }

        const data = fs.readFileSync(fileUri.fsPath).toString();
        const workflow = JSON.parse(data) as Workflow

        const client = new ISCClient(node.tenantId, node.tenantName);
        const created = await createWorkflow(client, workflow, workflow.name!)
        if (created) {
            vscode.window.showInformationMessage(`Successfully imported workflow ${created.name}`);
        }
    }
}
