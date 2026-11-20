import * as vscode from 'vscode';
import { CreateWorkflowV1Request as CreateWorkflowRequest, Workflow } from 'sailpoint-api-client/dist/workflows/api.js';
import { ISCClient } from '../../services/ISCClient.js';
import { isBlank } from '../../utils/stringUtils.js';
import * as commands from '../constants.js';
import { askObjectName } from '../cloneUtils.js';
import { cleanUpWorkflow } from './utils.js';

/**
 * Common logic for import and clone: asks for a name, cleans the definition
 * (owner, secrets...), creates the workflow disabled and refreshes the view.
 * @returns the created workflow or undefined if cancelled
 */
export async function createWorkflow(
    client: ISCClient,
    definition: Workflow | CreateWorkflowRequest,
    defaultName: string
): Promise<Workflow | undefined> {
    const name = await askObjectName("workflow", defaultName)
    if (isBlank(name)) {
        return undefined;
    }
    const cleanedWorkflow = cleanUpWorkflow(definition as Workflow)
    cleanedWorkflow.name = name
    cleanedWorkflow.enabled = false
    const created = await client.createWorflow(cleanedWorkflow as CreateWorkflowRequest)
    vscode.commands.executeCommand(commands.REFRESH_FORCED);
    return created
}
