import * as vscode from 'vscode';
import * as commands from '../commands/constants.js';
import { SourceDatasetsTreeItem, SourceDatasetTreeItem, SourceTreeItem, TenantTreeItem } from "../models/ISCTreeItem.js";
import { compareByName } from '../utils.js';
import { SailPointISCAuthenticationProvider } from "./AuthenticationProvider.js";
import { ISCClient } from "./ISCClient.js";
import { TenantService } from "./TenantService.js";
import { TransformEvaluator } from './TransformEvaluator.js';
import { TaskStatus, TaskStatusCompletionStatusEnum as TaskStatusCompletionStatus } from 'sailpoint-api-client/dist/task_management/api.js';
import { confirm } from '../utils/vsCodeHelpers.js';
import { formatTask, waitForTask } from '../commands/source/sourceUtils.js';
import { isTenantReadonly, validateTenantReadonly } from '../commands/validateTenantReadonly.js';

export class TreeManager {

    constructor(
        private readonly tenantService: TenantService,
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
            SailPointISCAuthenticationProvider.getInstance().removeSession(item.tenantId)
        } catch (err) {
            console.error("Session for ", tenantName, "does not exist:", err);
        }
        await this.tenantService.removeNode(item.tenantId);
        vscode.commands.executeCommand(commands.REFRESH_FORCED);
        vscode.window.showInformationMessage(`Successfully deleted tenant ${tenantName}`);
    }

    public async resetEntitlements(item: SourceTreeItem, doConfirm = true): Promise<TaskStatus | undefined> {
        console.log("> resetEntitlements", item)
        if (doConfirm) {
            if (isTenantReadonly(this.tenantService, item.tenantId)) {
                if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `reset entitlements for ${item.label}`))) {
                    return
                }
            } else if (!(await confirm(`Are you sure you want to reset entitlements for ${item.label}?`))) {
                return
            }
        }

        const client = new ISCClient(item.tenantId, item.tenantName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Resetting entitlements from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startEntitlementReset(item.id);
            const task = await waitForTask(client, job.id, token)
            formatTask(task,
                item.label as string,
                "Entitlements for {0} successfully reset",
                "Warning during entitlement reset of {0}: {1}",
                "Reset of entitlements for {0} failed: {1}: {2}"
            )
            return undefined;
        });
    }

    public async resetAccounts(item: SourceTreeItem, doConfirm = true): Promise<TaskStatus | undefined> {
        console.log("> resetAccounts", item)
        if (doConfirm) {
            if (isTenantReadonly(this.tenantService, item.tenantId)) {
                if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `reset accounts for ${item.label}`))) {
                    return
                }
            } else if (!(await confirm(`Are you sure you want to reset accounts for ${item.label}?`))) {
                return
            }
        }

        const client = new ISCClient(item.tenantId, item.tenantName);

        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Resetting accounts from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startAccountReset(item.id);
            const task = await waitForTask(client, job.id, token)
            formatTask(task,
                item.label as string,
                "Accounts for {0} successfully reset",
                "Warning during account reset of {0}: {1}",
                "Reset of accounts for {0} failed: {1}: {2}"
            )
            return task;
        });
    }

    public async aggregateEntitlements(item: SourceTreeItem): Promise<void> {
        console.log("> aggregateEntitlements", item)

        if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `aggregate entitlements for ${item.label}`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregation entitlements from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.startEntitlementAggregation(item.id);
            const task = await waitForTask(client, job.id, token)
            formatTask(task,
                item.label as string,
                "Source entitlements {0} successfully aggregated",
                "Warning during aggregation of {0}: {1}",
                "Aggregation of entitlements for {0} failed: {1}: {2}"
            )
        });
    }

    public async aggregateDataset(item: SourceDatasetTreeItem): Promise<void> {
        console.log("> aggregateDataset", item);

        if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `aggregate dataset ${item.label}`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregating dataset ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const task = await this.runDatasetAggregation(client, item.parentId, item.datasetId, token)
            formatTask(task,
                item.label as string,
                "Dataset {0} successfully aggregated",
                "Warning during aggregation of {0}: {1}",
                "Aggregation of {0} failed: {1}: {2}"
            )
        });
    }

    private async runDatasetAggregation(client: ISCClient, sourceId: string, datasetId: string, token: vscode.CancellationToken): Promise<TaskStatus | null> {
        const job = await client.startDatasetAggregation(sourceId, datasetId);
        if (!job.id) {
            throw new Error("Dataset aggregation did not return a task id");
        }
        return await waitForTask(client, job.id, token)
    }

    public async aggregateAllDatasets(item: SourceDatasetsTreeItem): Promise<void> {
        console.log("> aggregateAllDatasets", item);

        const sourceName = item.sourceName
        if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `aggregate all datasets of ${sourceName}`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);
        const datasets = (await client.getSourceDatasets(item.sourceId)).sort(compareByName);
        if (datasets.length === 0) {
            vscode.window.showInformationMessage(`No dataset to aggregate for ${sourceName}`);
            return
        }

        const succeeded: string[] = []
        const warnings: string[] = []
        const errors: string[] = []
        let cancelled = false

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregating datasets of ${sourceName}`,
            cancellable: true
        }, async (progress, token) => {
            for (const [index, dataset] of datasets.entries()) {
                if (token.isCancellationRequested) {
                    cancelled = true
                    break
                }
                const name = dataset.name ?? dataset.id!
                progress.report({
                    message: `${name} (${index + 1}/${datasets.length})`,
                    increment: index === 0 ? 0 : 100 / datasets.length
                })
                try {
                    const task = await this.runDatasetAggregation(client, item.sourceId, dataset.id!, token)
                    if (task === null) {
                        cancelled = true
                        break
                    }
                    const firstMessage = task.messages?.[0]?.key
                    if (task.completionStatus === TaskStatusCompletionStatus.Success) {
                        succeeded.push(name)
                    } else if (task.completionStatus === TaskStatusCompletionStatus.Warning) {
                        warnings.push(firstMessage ? `${name} (${firstMessage})` : name)
                    } else {
                        errors.push(`${name} (${[task.completionStatus, firstMessage].filter(Boolean).join(": ")})`)
                    }
                } catch (error) {
                    console.error("Aggregation of dataset failed", name, error)
                    errors.push(`${name} (${error instanceof Error ? error.message : String(error)})`)
                }
            }
        });

        const processed = succeeded.length + warnings.length + errors.length
        const lines = [
            `Aggregation of datasets for ${sourceName}${cancelled ? ` cancelled after ${processed}/${datasets.length}` : ""}: ${succeeded.length} succeeded, ${warnings.length} with warning, ${errors.length} failed.`
        ]
        if (succeeded.length) { lines.push(`Succeeded: ${succeeded.join(", ")}`) }
        if (warnings.length) { lines.push(`Warning: ${warnings.join(", ")}`) }
        if (errors.length) { lines.push(`Error: ${errors.join(", ")}`) }
        const summary = lines.join("\n")

        if (errors.length) {
            vscode.window.showErrorMessage(summary)
        } else if (warnings.length || cancelled) {
            vscode.window.showWarningMessage(summary)
        } else {
            vscode.window.showInformationMessage(summary)
        }
    }

    public async removeDatasetObjects(item: SourceDatasetTreeItem): Promise<void> {
        console.log("> removeDatasetObjects", item);

        if (isTenantReadonly(this.tenantService, item.tenantId)) {
            if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `remove objects for dataset ${item.label}`))) {
                return
            }
        } else if (!(await confirm(`Are you sure you want to remove objects for dataset ${item.label}?`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Removing objects from dataset ${item.label}`,
            cancellable: true
        }, async (progress, token) => {
            const job = await client.deleteDatasetObjects(item.parentId, item.datasetId);
            if (!job.id) {
                throw new Error("Dataset object removal did not return a task id");
            }
            const task = await waitForTask(client, job.id, token)
            formatTask(task,
                item.label as string,
                "Objects for dataset {0} successfully removed",
                "Warning during object removal of {0}: {1}",
                "Removal of objects for {0} failed: {1}: {2}"
            )
        });
    }

    public async aggregateSource(item: SourceTreeItem, disableOptimization = false): Promise<void> {
        console.log("> aggregateSource", item, disableOptimization);

        if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `aggregate source ${item.label}`))) {
            return
        }

        const client = new ISCClient(item.tenantId, item.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregation accounts from ${item.label}`,
            cancellable: true
        }, async (progress, token) => {


            const job = await client.startAccountAggregation(item.id!, disableOptimization)
            const task = await waitForTask(client, job.task.id, token)
            formatTask(task,
                item.label as string,
                "Source {0} successfully aggregated",
                "Warning during aggregation of {0}: {1}",
                "Aggregation of {0} failed: {1}: {2}"
            )
        });
    }

    public async resetSource(item: SourceTreeItem): Promise<void> {
        console.log("> resetSource", item);

        if (isTenantReadonly(this.tenantService, item.tenantId)) {
            if (!(await validateTenantReadonly(this.tenantService, item.tenantId, `reset the source ${item.label}`))) {
                return
            }
        } else if (!(await confirm(`Are you sure you want to reset the source ${item.label}?`))) {
            return
        }

        const task = await this.resetAccounts(item, false)
        if (task?.completionStatus === TaskStatusCompletionStatus.Success) {
            await this.resetEntitlements(item, false)
        }
    }

    public async evaluateTransform(item: SourceTreeItem): Promise<void> {
        console.log("> NewTransformCommand.evaluate", item);

        await this.transformEvaluator.evaluate(item);
    };
}