import * as vscode from 'vscode';
import { ISCClient } from "../../services/ISCClient";
import { delay, formatString } from "../../utils";

import { AccountActivity, CompletionStatus, ExecutionStatus, ProvisioningState } from 'sailpoint-api-client';
const TERMINAL_PROVISIONING_STATES = new Set<ProvisioningState>([
    ProvisioningState.Finished,
    ProvisioningState.Failed,
    ProvisioningState.Unverifiable,
    ProvisioningState.Commited,
]);

export function isAccountActivityInProgress(activity: AccountActivity): boolean {
    if (activity.executionStatus === ExecutionStatus.Completed ||
        activity.executionStatus === ExecutionStatus.Terminated) {
        return false;
    }

    if (activity.completed) {
        return false;
    }

    if (activity.completionStatus === CompletionStatus.Success ||
        activity.completionStatus === CompletionStatus.Failure ||
        activity.completionStatus === CompletionStatus.Incomplete) {
        return false;
    }

    if (activity.items?.length && areActivityItemsComplete(activity.items)) {
        return false;
    }

    return activity.completionStatus === null ||
        activity.completionStatus === undefined ||
        activity.completionStatus === CompletionStatus.Pending;
}

function areActivityItemsComplete(items: AccountActivity["items"]): boolean {
    if (!items || items.length === 0) {
        return false;
    }

    return items.every(item =>
        item.provisioningStatus !== undefined &&
        item.provisioningStatus !== null &&
        TERMINAL_PROVISIONING_STATES.has(item.provisioningStatus)
    );
}

export async function waitForAccountActivity(
    client: ISCClient,
    accountActivityId: string,
    token: vscode.CancellationToken
): Promise<AccountActivity | null> {
    console.log("> waitForAccountActivity", accountActivityId);
    let activity: AccountActivity | null = null;

    do {
        if (token.isCancellationRequested) {
            return null;
        }

        activity = await client.getAccountActivity(accountActivityId);
        console.log("account activity =", activity);

        if (!isAccountActivityInProgress(activity)) {
            break;
        }

        await delay(5000);
    } while (true);

    return activity;
}

function isAccountActivitySuccessful(activity: AccountActivity): boolean {
    if (activity.completionStatus === CompletionStatus.Success) {
        return true;
    }

    if (activity.executionStatus === ExecutionStatus.Completed) {
        return !activity.errors?.length &&
            !(activity.items?.some(item => item.provisioningStatus === ProvisioningState.Failed));
    }

    return false;
}

export function formatAccountActivity(
    activity: AccountActivity | null,
    identityName: string,
    lifecycleStateName: string
) {
    if (activity === null) {
        return;
    }

    const errorDetail = activity.errors?.[0];
    const warningDetail = activity.warnings?.[0];
    const failedItem = activity.items?.find(item => item.provisioningStatus === ProvisioningState.Failed);

    if (isAccountActivitySuccessful(activity)) {
        vscode.window.showInformationMessage(
            formatString("Lifecycle state for {0} set to {1} successfully", identityName, lifecycleStateName)
        );
    } else if (activity.completionStatus === CompletionStatus.Failure || failedItem || errorDetail) {
        vscode.window.showErrorMessage(
            formatString(
                "Lifecycle state update for {0} failed: {1}",
                identityName,
                errorDetail ?? failedItem?.name ?? activity.completionStatus ?? activity.executionStatus ?? "Unknown error"
            )
        );
    } else if (warningDetail) {
        vscode.window.showWarningMessage(
            formatString(
                "Lifecycle state update for {0} completed with warning: {1}",
                identityName,
                warningDetail
            )
        );
    } else {
        vscode.window.showWarningMessage(
            formatString(
                "Lifecycle state update for {0} completed with status {1}",
                identityName,
                activity.completionStatus ?? activity.executionStatus ?? "UNKNOWN"
            )
        );
    }
}
