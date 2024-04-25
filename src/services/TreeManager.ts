import * as vscode from 'vscode';
import * as commands from '../commands/constants';
import { SourceTreeItem, TenantTreeItem } from "../models/ISCTreeItem";
import { delay, formatString } from "../utils";
import { ISCDataProvider } from "../views/ISCDataProvider";
import { SailPointISCAuthenticationProvider } from "./AuthenticationProvider";
import { AggregationJob, ISCClient } from "./ISCClient";
import { TenantService } from "./TenantService";
import { TransformEvaluator } from './TransformEvaluator';
import { TaskStatusBeta, TaskStatusBetaCompletionStatusEnum } from 'sailpoint-api-client';
import { confirm } from '../utils/vsCodeHelpers';

export class TreeManager {

    constructor(
        private readonly dataProvider: ISCDataProvider,
        private readonly tenantService: TenantService,
        private readonly authProvider: SailPointISCAuthenticationProvider,
        private readonly transformEvaluator: TransformEvaluator,
    ) { }

    public async removeTenant(item: TenantTreeItem): Promise<void> {
        console.log("> removeTenant", item);
        // assessing that item is a TenantTreeItem
        if (item === undefined || !(item instanceof TenantTreeItem)) {
            console.log("WARNING: removeTenant: invalid item", item);
            throw new Error("removeTenant: invalid item");
        }
        const tenantName = item.tenantName || "";
        const response = await vscode.window.showWarningMessage(
            `Are you sure you want to delete tenant ${tenantName}?`,
            { modal: true },
            ...["Yes", "No"]
        );
        if (response !== "Yes") {
            console.log("< removeTenant: no delete");
            return;
        }
        try {
            const session = await vscode.authentication.getSession(SailPointISCAuthenticationProvider.id, [item.tenantId], { createIfNone: false });
            if (session !== undefined) {
                this.authProvider.removeSession(session.id);
            }
        } catch (err) {
            console.error("Session for ", tenantName, "does not exist:", err);
        }
        await this.tenantService.removeTenant(item.tenantId);
        vscode.commands.executeCommand(commands.REFRESH_FORCED);
        vscode.window.showInformationMessage(`Successfully deleted tenant ${tenantName}`);
    }

    private async waifForJob(client: ISCClient, taskId: string, token: vscode.CancellationToken): Promise<TaskStatusBeta | null> {
        console.log("> waifForJob", taskId);
        let task: TaskStatusBeta | null = null;
        do {
            if (token.isCancellationRequested) {
                return null
            }
            await delay(1000);
            if (token.isCancellationRequested) {
                return null
            }
            task = await client.getTaskStatus(taskId);
            console.log("task =", task);

        } while (task.completionStatus === null)

        return task
    }

    private formatTask(task: TaskStatusBeta, objectName: string,
        successMessage: string,
        warningMessage: string,
        errorMessage: string
    ) {
        if (task !== null) {
            // XXX toUpperCase() required because of https://github.com/sailpoint-oss/api-specs/issues/70
            if (task.completionStatus.toUpperCase() === TaskStatusBetaCompletionStatusEnum.Success.toUpperCase()) {
                vscode.window.showInformationMessage(
                    formatString(successMessage, objectName))
            } else if (task.completionStatus === TaskStatusBetaCompletionStatusEnum.Warning) {
                vscode.window.showWarningMessage(
                    formatString(warningMessage, objectName, task.messages[0]?.key))
            } else {
                vscode.window.showErrorMessage(
                    formatString(errorMessage, objectName, task.completionStatus, task.messages[0]?.key))
            }
        };
    }

    public async resetEntitlements(item: SourceTreeItem, doConfirm = true): Promise<TaskStatusBeta | undefined> {
        console.log("> resetEntitlements", item)
        if (doConfirm && !(await confirm(`Are you sure you want to reset entitlements for ${item.label}?`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Resetting entitlements from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startEntitlementReset(item.id);
            const task = await this.waifForJob(client, job.id, token)
            this.formatTask(task,
                item.label as string,
                "Entitlements for {0} successfully resetted",
                "Warning during entitlement reset of {0}: {1}",
                "Reset of entitlements for {0} failed: {1}: {2}"
            )
            return undefined;
        });
    }

    public async resetAccounts(item: SourceTreeItem, doConfirm = true): Promise<TaskStatusBeta | undefined> {
        console.log("> resetAccounts", item)
        if (doConfirm && !(await confirm(`Are you sure you want to reset accounts for ${item.label}?`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Resetting accounts from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startAccountReset(item.id);
            const task = await this.waifForJob(client, job.id, token)
            this.formatTask(task,
                item.label as string,
                "Accounts for {0} successfully resetted",
                "Warning during account reset of {0}: {1}",
                "Reset of accounts for {0} failed: {1}: {2}"
            )
            return undefined;
        });
    }

    public async aggregateEntitlements(item: SourceTreeItem): Promise<void> {
        console.log("> aggregateEntitlements", item)
        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregation entitlements from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startEntitlementAggregation(item.id);
            const task = await this.waifForJob(client, job.id, token)
            this.formatTask(task,
                item.label as string,
                "Source entitlements {0} successfully aggregated",
                "Warning during aggregation of {0}: {1}",
                "Aggregation of entitlements for {0} failed: {1}: {2}"
            )
        });

    }

    public async aggregateSource(item: SourceTreeItem, disableOptimization = false, type = "accounts"): Promise<void> {
        console.log("> aggregateSource", item, disableOptimization);
        // assessing that item is a SourceTreeItem
        if (item === undefined || !(item instanceof SourceTreeItem)) {
            console.log("WARNING: aggregateSource: invalid item", item);
            throw new Error("aggregateSource: invalid item");
        }
        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregation of ${type} from ${item.label}`,
            cancellable: false
        }, async (progress, token) => {
            let job: any;
            let jobType: AggregationJob;
            if ("accounts" === type) {

                job = await client.startAccountAggregation(item.ccId, disableOptimization)
                    .catch(error => {
                        console.error(error);
                    });
                jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION;
            }
            console.log("job =", job);
            let task: any | null = null;
            do {
                await delay(5000);
                task = await client.getAggregationJob(item.ccId, job.task.id, jobType);
                console.log("task =", task);

            } while (task !== undefined && task.status === "PENDING");
            if (task !== undefined) {
                if (task.status === "SUCCESS") {
                    vscode.window.showInformationMessage(`Source ${task.object.displayName} successfully aggregated`);
                } else if (task.status === "WARNING") {
                    vscode.window.showWarningMessage(
                        `Warning during aggregation of ${task.object.displayName}: ${task.details?.messages?.Warn}`);
                } else {
                    vscode.window.showErrorMessage(
                        `Aggregation of ${task.object.displayName} failed: ${task.status}: ${task.details?.messages?.Error}`);
                }
            };
        });
    }

    public async resetSource(item: SourceTreeItem): Promise<void> {
        console.log("> resetSource", item);
        if (!(await confirm(`Are you sure you want to reset the source ${item.label}?`))) {
            return
        }
        const task = await this.resetAccounts(item, false)
        if (task?.completionStatus.toUpperCase() === TaskStatusBetaCompletionStatusEnum.Success.toUpperCase()) {
            await this.resetEntitlements(item, false)
        }
    }

    public async evaluateTransform(item: SourceTreeItem): Promise<void> {
        console.log("> NewTransformCommand.evaluate", item);

        await this.transformEvaluator.evaluate(item);
    };
}