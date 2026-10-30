import { TaskStatus, TaskStatusCompletionStatusEnum as TaskStatusCompletionStatus } from "sailpoint-api-client/dist/task_management/api.js";
import { ISCClient } from "../../services/ISCClient.js";
import * as vscode from 'vscode';
import { delay, formatString } from "../../utils.js";

/**
 * Waits for the end of a task. It is tolerant to errors
 * (a task can be unknown for a few seconds just after its submission) and has a timeout.
 * Returns null if cancelled or if the timeout is reached.
 */
export async function waitForTask(
    client: ISCClient,
    taskId: string,
    token: vscode.CancellationToken,
    intervalMs = 2000,
    timeoutMs = 5 * 60 * 1000
): Promise<TaskStatus | null> {
    console.log("> waitForTask", taskId);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        await delay(intervalMs);
        if (token.isCancellationRequested) {
            return null;
        }
        try {
            const task = await client.getTaskStatus(taskId);
            if (task.completionStatus !== null && task.completionStatus !== undefined) {
                return task;
            }
        } catch (error: any) {
            console.log("waitForTask: task status not available yet", error?.message ?? error);
        }
    }
    return null;
}

export function formatTask(task: TaskStatus, objectName: string,
    successMessage: string,
    warningMessage: string,
    errorMessage: string
) {
    if (task !== null) {
        if (task.completionStatus === TaskStatusCompletionStatus.Success) {
            vscode.window.showInformationMessage(
                formatString(successMessage, objectName))
        } else if (task.completionStatus === TaskStatusCompletionStatus.Warning) {
            vscode.window.showWarningMessage(
                formatString(warningMessage, objectName, task.messages[0]?.key))
        } else {
            vscode.window.showErrorMessage(
                formatString(errorMessage, objectName, task.completionStatus, task.messages[0]?.key))
        }
    };
}