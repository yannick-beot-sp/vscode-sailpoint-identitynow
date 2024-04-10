import * as vscode from 'vscode';
import { WorkflowTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { getWorkflowExecutionDetailUri } from '../../utils/UriUtils';
import { WorkflowExecutionBeta } from 'sailpoint-api-client';
import { openPreview } from '../../utils/vsCodeHelpers';

export async function viewWorkflowExecutionHistory(node: WorkflowTreeItem): Promise<void> {

    console.log("> viewWorkflowExecutionHistory", node);
    if (node === undefined || !(node instanceof WorkflowTreeItem)) {
        console.log("WARNING: viewWorkflowExecutionHistory: invalid item", node);
        throw new Error("viewWorkflowExecutionHistory: invalid item");
    }
    const client = new ISCClient(node.tenantId, node.tenantName);

    let history = await vscode.window.withProgress<WorkflowExecutionBeta[]>({
        location: vscode.ProgressLocation.Notification,
        title: 'Listing workflow executions...',
        cancellable: false
    }, async (task, token) => {
        return await client.getWorkflowExecutionHistory(node.id as string);
    });

    if (history === undefined || !Array.isArray(history) || history.length < 1) {
        await vscode.window.showErrorMessage('No execution history');
        return;
    }

    // Sorting descendant to get latest execution first
    history.sort((a, b) => (a.startTime! < b.startTime!) ? 1 : -1);

    // At this moment, the execution history is kept 2 days. No need to display more
    const oldest = new Date();
    oldest.setDate(oldest.getDate() - 2);
    const oldestStr = oldest.toISOString();
    console.log('Looking for execution more recent than ', oldestStr);

    history = history.filter(a => a.startTime! > oldestStr);
    if (history.length < 1) {
        await vscode.window.showErrorMessage('No execution history');
        return;
    }
    const items = history.map<vscode.QuickPickItem>(x => ({
        label: x.id!,
        detail: x.startTime
    }));

    const item = await vscode.window.showQuickPick<vscode.QuickPickItem>(items);

    if (item === undefined) {
        console.log("< viewWorkflowExecutionHistory: no selected item");
        return;
    }
    console.log('viewWorkflowExecutionHistory: selected item:', item);

    const uri = getWorkflowExecutionDetailUri(node.tenantName, item?.label as string);
    console.log('viewWorkflowExecutionHistory: uri:', uri);
    
    openPreview(uri)

    console.log("< viewWorkflowExecutionHistory");
}