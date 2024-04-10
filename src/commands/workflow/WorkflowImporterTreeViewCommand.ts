import { chooseFile } from '../../utils/vsCodeHelpers';
import { WorkflowsTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { WorkflowBeta } from 'sailpoint-api-client';
import { cleanUpWorkflow } from './utils';
import { isBlank } from '../../utils/stringUtils';
import * as commands from '../constants';



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

    async execute(node: WorkflowsTreeItem): Promise<void> {
        console.log("> WorkflowImporterTreeViewCommand.execute");

        const fileUri = await chooseFile('JSON', 'json');
        if (fileUri === undefined) { return; }


        const data = fs.readFileSync(fileUri.fsPath).toString();

        const workflow = JSON.parse(data) as WorkflowBeta

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
