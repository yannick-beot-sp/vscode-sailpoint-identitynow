import * as vscode from 'vscode';

import { AccountTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import * as commands from '../constants';
import { formatTask, waifForJob } from '../source/sourceUtils';
import { formatHecateAggregateJob, waitForHecateJob } from './accountUtils';

export class AccountTreeViewCommand {

    constructor() { }

    async enable(node?: AccountTreeItem): Promise<void> {
        console.log("> AccountTreeViewCommand.enable");
        await this.runTaskOperation(node, "Enable", (client, accountId) => client.enableAccount(accountId));
    }

    async disable(node?: AccountTreeItem): Promise<void> {
        console.log("> AccountTreeViewCommand.disable");
        await this.runTaskOperation(node, "Disable", (client, accountId) => client.disableAccount(accountId));
    }

    async unlock(node?: AccountTreeItem): Promise<void> {
        console.log("> AccountTreeViewCommand.unlock");
        await this.runTaskOperation(node, "Unlock", (client, accountId) => client.unlockAccount(accountId));
    }

    async aggregateOne(node?: AccountTreeItem): Promise<void> {
        console.log("> AccountTreeViewCommand.aggregateOne");
        await this.runAggregateOperation(node);
    }

    async remove(node?: AccountTreeItem): Promise<void> {
        console.log("> AccountTreeViewCommand.remove");

        if (node === undefined) {
            return;
        }

        if (!node.removable) {
            vscode.window.showWarningMessage(
                "This account cannot be removed because it is authoritative or a system account."
            );
            return;
        }

        const accountName = node.label as string;
        const answer = await vscode.window.showWarningMessage(
            `Are you sure you want to remove account ${accountName}?`,
            { modal: true },
            "Yes",
            "No"
        );

        if (answer !== "Yes") {
            return;
        }

        await this.runTaskOperation(node, "Remove", (client, accountId) => client.deleteAccount(accountId));
    }

    private async refreshAccountsFolder(node: AccountTreeItem): Promise<void> {
        if (node.parentNode) {
            await vscode.commands.executeCommand(commands.REFRESH_FORCED, node.parentNode);
        }
    }

    private async runTaskOperation(
        node: AccountTreeItem | undefined,
        action: string,
        operation: (client: ISCClient, accountId: string) => Promise<string | undefined>
    ): Promise<void> {
        if (node === undefined) {
            return;
        }

        const accountName = node.label as string;

        try {
            const client = new ISCClient(node.tenantId, node.tenantName);
            const taskId = await operation(client, node.resourceId);

            if (!taskId) {
                vscode.window.showInformationMessage(`${action} account ${accountName} started`);
                await this.refreshAccountsFolder(node);
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${action} account ${accountName}`,
                cancellable: true
            }, async (_progress, token) => {
                const task = await waifForJob(client, taskId, token);
                formatTask(
                    task,
                    accountName,
                    `${action} account {0} completed successfully`,
                    `${action} account {0} completed with warning: {1}`,
                    `${action} account {0} failed: {1}: {2}`
                );
                await this.refreshAccountsFolder(node);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Could not ${action.toLowerCase()} account ${accountName}: ${error}`);
        }
    }

    private async runAggregateOperation(node: AccountTreeItem | undefined): Promise<void> {
        if (node === undefined) {
            return;
        }

        const accountName = node.label as string;
        const action = "Aggregate one";

        try {
            const client = new ISCClient(node.tenantId, node.tenantName);
            const jobId = await client.reloadAccount(node.resourceId);

            if (!jobId) {
                vscode.window.showInformationMessage(`${action} account ${accountName} started`);
                await this.refreshAccountsFolder(node);
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `${action} account ${accountName}`,
                cancellable: true
            }, async (_progress, token) => {
                const job = await waitForHecateJob(client, jobId, token);
                formatHecateAggregateJob(job, accountName, action);
                await this.refreshAccountsFolder(node);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Could not aggregate account ${accountName}: ${error}`);
        }
    }
}
