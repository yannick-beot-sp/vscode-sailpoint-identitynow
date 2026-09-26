import * as vscode from 'vscode';

import { HecateJobStatus } from '../../models/HecateJob';
import { ISCClient } from '../../services/ISCClient';
import { Account } from 'sailpoint-api-client';
import { delay, formatString } from '../../utils';

export function isAccountRemovable(account: Account): boolean {
	return account.authoritative !== true && account.systemAccount !== true;
}

export async function waitForHecateJob(
    client: ISCClient,
    jobId: string,
    token: vscode.CancellationToken
): Promise<HecateJobStatus | null> {
    console.log("> waitForHecateJob", jobId);
    let job: HecateJobStatus | null = null;

    do {
        if (token.isCancellationRequested) {
            return null;
        }

        job = await client.getHecateJobStatus(jobId);
        console.log("hecate job =", job);

        if (job.status !== "IN_PROGRESS") {
            break;
        }

        await delay(5000);
    } while (true);

    return job;
}

function hasHecateJobAccountErrors(job: HecateJobStatus): boolean {
    if (!job.resultJson) {
        return false;
    }

    try {
        const result = typeof job.resultJson === "string"
            ? JSON.parse(job.resultJson)
            : job.resultJson;
        const accountErrors = result?.accountErrors;
        return accountErrors === 1 || accountErrors === "1" || (typeof accountErrors === "number" && accountErrors > 0);
    } catch (error) {
        console.warn("Could not parse hecate job resultJson", error);
        return false;
    }
}

export function formatHecateAggregateJob(
    job: HecateJobStatus | null,
    accountName: string,
    action: string
) {
    if (job === null) {
        return;
    }

    if (job.status === "SUCCESS" && !hasHecateJobAccountErrors(job)) {
        vscode.window.showInformationMessage(
            formatString("{0} account {1} completed successfully", action, accountName)
        );
        return;
    }

    if (job.status === "SUCCESS" && hasHecateJobAccountErrors(job)) {
        vscode.window.showErrorMessage(
            formatString("{0} account {1} failed during aggregation", action, accountName)
        );
        return;
    }

    vscode.window.showErrorMessage(
        formatString("{0} account {1} failed: {2}", action, accountName, job.status)
    );
}
