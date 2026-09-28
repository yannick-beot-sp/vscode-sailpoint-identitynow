import { TaskStatus, TaskStatusCompletionStatusEnum as TaskStatusCompletionStatus } from "sailpoint-api-client/dist/task_management/api.js";
import { ISCClient } from "../../services/ISCClient.js";
import * as vscode from 'vscode';
import { delay, formatString } from "../../utils.js";

export async function waifForJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<TaskStatus | null> {
    console.log("> waifForJob", taskId);
    let task: TaskStatus | null = null;
    do {
        if (token.isCancellationRequested) {
            return null
        }
        await delay(5000);
        if (token.isCancellationRequested) {
            return null
        }
        task = await client.getTaskStatus(taskId);
        console.log("task =", task);

    } while (task.completionStatus === null)

    return task
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