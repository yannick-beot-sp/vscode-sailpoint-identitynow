import { BackupResponseV2024, SpConfigJobBeta, SpConfigJobBetaStatusBeta } from "sailpoint-api-client";
import { ISCClient } from "../../services/ISCClient";
import * as vscode from 'vscode';
import { delay } from "../../utils";

export async function waitForImportJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<SpConfigJobBeta | null> {

    return await waitFor(taskId,
        token,
        async (taskId) => await client.getImportJobStatus(taskId),
        (status: SpConfigJobBeta) => status.status === SpConfigJobBetaStatusBeta.NotStarted || status.status === SpConfigJobBetaStatusBeta.InProgress)
}

export async function waitForUploadJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<BackupResponseV2024 | null> {

    return await waitFor(taskId,
        token,
        async (taskId) => await client.getUploadConfigurationJobStatus(taskId),
        (status: BackupResponseV2024) => status.status === SpConfigJobBetaStatusBeta.NotStarted || status.status === SpConfigJobBetaStatusBeta.InProgress)
}


export async function waitFor<T>(taskId: string, token: vscode.CancellationToken, updateStatus: (taskId) => Promise<T>, isPending: (status: T) => boolean): Promise<T | undefined> {
    console.log("> waifFor", taskId);
    let jobStatus: T | undefined = undefined;
    do {
        if (token.isCancellationRequested) {
            return null
        }
        await delay(5000);
        if (token.isCancellationRequested) {
            return null
        }
        jobStatus = await updateStatus(taskId)
        console.log({ jobStatus });
    } while (isPending(jobStatus));


    return jobStatus
}