import * as vscode from 'vscode';
import * as commands from '../constants';
import { WorkflowTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { getResourceUri } from '../../utils/UriUtils';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

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
            await client.updateWorkflowStatus(node.id, enable);
            node.enabled = enable;
            vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
            const uri = getResourceUri(
                node.tenantName,
                "workflows",
                node.id,
                node.label as string,
                true
            )
            await vscode.commands.executeCommand(commands.MODIFIED_RESOURCE, uri);
        });
        console.log("< updateWorkflowStatus");
    }
}