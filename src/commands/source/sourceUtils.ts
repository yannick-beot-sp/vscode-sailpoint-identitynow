import { TaskStatusBeta, TaskStatusBetaCompletionStatusBeta } from "sailpoint-api-client";
import { ISCClient } from "../../services/ISCClient";
import * as vscode from 'vscode';
import { delay, formatString } from "../../utils";

export async function waifForJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<TaskStatusBeta | null> {
    console.log("> waifForJob", taskId);
    let task: TaskStatusBeta | null = null;
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

export function formatTask(task: TaskStatusBeta, objectName: string,
    successMessage: string,
    warningMessage: string,
    errorMessage: string
) {
    if (task !== null) {
        if (task.completionStatus === TaskStatusBetaCompletionStatusBeta.Success) {
            vscode.window.showInformationMessage(
                formatString(successMessage, objectName))
        } else if (task.completionStatus === TaskStatusBetaCompletionStatusBeta.Warning) {
            vscode.window.showWarningMessage(
                formatString(warningMessage, objectName, task.messages[0]?.key))
        } else {
            vscode.window.showErrorMessage(
                formatString(errorMessage, objectName, task.completionStatus, task.messages[0]?.key))
        }
    };
}