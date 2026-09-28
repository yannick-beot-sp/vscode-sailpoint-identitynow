import * as vscode from 'vscode';
import * as commands from '../constants.js';
import { WorkflowTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { getResourceUri } from '../../utils/UriUtils.js';
import { TenantService } from '../../services/TenantService.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';

export class UpdateWorkflowStatusCommand {

    constructor(private readonly tenantService: TenantService) { }


    public async enableWorkflow(node: WorkflowTreeItem): Promise<void> {
        console.log("> enableWorkflow", node);

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `enable workflow ${node.label}`))) {
            return
        }
        
        await this.updateWorkflowStatus(node, true);
        await vscode.window.showInformationMessage(`Successfully enabled workflow ${node?.label}`);
        console.log("< enableWorkflow", node);
    }
    
    public async disableWorkflow(node: WorkflowTreeItem): Promise<void> {
        console.log("> disableWorkflow", node);

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `disable workflow ${node.label}`))) {
            return
        }

        await this.updateWorkflowStatus(node, false);
        await vscode.window.showInformationMessage(`Successfully disabled workflow ${node?.label}`);
        console.log("< disableWorkflow", node);
    }

    private async updateWorkflowStatus(node: WorkflowTreeItem, enable: boolean): Promise<void> {

        console.log("> updateWorkflowStatus", node);
        if (node === undefined || !(node instanceof WorkflowTreeItem)) {
            console.log("WARNING: updateWorkflowStatus: invalid item", node);
            throw new Error("updateWorkflowStatus: invalid item");
        }
        const client = new ISCClient(node.tenantId, node.tenantName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `${enable ? 'Enabling' : 'Disabling'} workflow...`,
            cancellable: false
        }, async () => {
            await client.updateWorkflowStatus(node.resourceId, enable);
            node.enabled = enable;
            vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
            const uri = getResourceUri(
                node.tenantName,
                "workflows",
                node.resourceId,
                node.label as string
            )
            await vscode.commands.executeCommand(commands.MODIFIED_RESOURCE, uri);
        });
        console.log("< updateWorkflowStatus");
    }
}