import * as vscode from 'vscode';
import { WorkflowTreeItem } from '../../models/ISCTreeItem.js';
import { TenantService } from '../../services/TenantService.js';
import { chooseTenants } from '../cloneUtils.js';
import { createWorkflow } from './createWorkflow.js';

export class WorkflowCloneCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node: WorkflowTreeItem): Promise<void> {
        console.log("> WorkflowCloneCommand.execute");

        const ctx = await chooseTenants(this.tenantService, node, "workflow", node.label as string)
        if (!ctx) {
            return;
        }

        const workflow = await ctx.sourceClient.getWorflowById(node.resourceId)
        const created = await createWorkflow(ctx.targetClient, workflow, ctx.defaultName(workflow.name))
        if (created) {
            vscode.window.showInformationMessage(`Successfully cloned workflow ${workflow.name} to ${created.name} in ${ctx.targetTenant.name}`);
        }
    }
}
