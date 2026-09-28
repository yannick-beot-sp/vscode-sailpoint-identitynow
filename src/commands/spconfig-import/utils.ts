import { BackupResponse } from "sailpoint-api-client/dist/configuration_hub/api.js";
import { SpConfigJob, SpConfigJobStatusEnum as SpConfigJobStatus } from "sailpoint-api-client/dist/sp_config/api.js";
import { ISCClient } from "../../services/ISCClient.js";
import * as vscode from 'vscode';
import { delay } from "../../utils.js";

export async function waitForImportJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<SpConfigJob | null> {

    return await waitFor(taskId,
        token,
        async (taskId) => await client.getImportJobStatus(taskId),
        (status: SpConfigJob) => status.status === SpConfigJobStatus.NotStarted || status.status === SpConfigJobStatus.InProgress)
}

export async function waitForUploadJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<BackupResponse | null> {

    return await waitFor(taskId,
        token,
        async (taskId) => await client.getUploadConfigurationJobStatus(taskId),
        (status: BackupResponse) => status.status === SpConfigJobStatus.NotStarted || status.status === SpConfigJobStatus.InProgress)
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