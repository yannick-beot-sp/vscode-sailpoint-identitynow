import { chooseFile } from '../../utils/vsCodeHelpers.js';
import { WorkflowsTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { CreateWorkflowV1Request as CreateWorkflowRequest } from 'sailpoint-api-client/dist/workflows/api.js';
import { cleanUpWorkflow } from './utils.js';
import { isBlank } from '../../utils/stringUtils.js';
import * as commands from '../constants.js';
import { TenantService } from '../../services/TenantService.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';



async function askWorkflowName(defaultWorkflowName: string): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: defaultWorkflowName,
        ignoreFocusOut: true,
        placeHolder: 'Workflow name',
        prompt: "Enter the workflow name",
        title: 'Identity Security Cloud',
        validateInput: text => {
            if (isBlank(text)) {
                return "You must provide a new name for the workflow.";
            }
            return null
        }
    });
    return result?.trim();
}

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

        const workflow = JSON.parse(data) as CreateWorkflowRequest

        const name = await askWorkflowName(workflow.name)
        if (isBlank(name)) {
            return;
        }
        const cleanedWorkflow = cleanUpWorkflow(workflow)
        cleanedWorkflow.name = name
        cleanedWorkflow.enabled = false
        const client = new ISCClient(node.tenantId, node.tenantName);
        await client.createWorflow(workflow)
        vscode.window.showInformationMessage(`Successfully imported workflow ${name}`);
        vscode.commands.executeCommand(commands.REFRESH_FORCED);
    }
}
