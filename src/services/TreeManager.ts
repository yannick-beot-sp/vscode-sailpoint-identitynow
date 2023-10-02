import * as vscode from 'vscode';
import * as commands from '../commands/constants';
import { SourceTreeItem, TenantTreeItem } from "../models/IdentityNowTreeItem";
import { delay } from "../utils";
import { IdentityNowDataProvider } from "../views/IdentityNowDataProvider";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import { AggregationJob, IdentityNowClient } from "./IdentityNowClient";
import { TenantService } from "./TenantService";
import { TransformEvaluator } from './TransformEvaluator';

export class TreeManager {

    constructor(
        private readonly dataProvider: IdentityNowDataProvider,
        private readonly tenantService: TenantService,
        private readonly authProvider: SailPointIdentityNowAuthenticationProvider,
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
            const session = await vscode.authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [item.tenantId], { createIfNone: false });
            if (session !== undefined) {
                this.authProvider.removeSession(session.id);
            }
        } catch (err) {
            console.error("Session for ", tenantName, "does not exist:", err);
        }
        await this.tenantService.removeTenant(item.tenantId);
        vscode.commands.executeCommand(commands.REFRESH);
        vscode.window.showInformationMessage(`Successfully deleted tenant ${tenantName}`);
    }

    public async aggregateSource(item: SourceTreeItem, disableOptimization = false, type = "accounts"): Promise<void> {
        console.log("> aggregateSource", item, disableOptimization);
        // assessing that item is a SourceTreeItem
        if (item === undefined || !(item instanceof SourceTreeItem)) {
            console.log("WARNING: aggregateSource: invalid item", item);
            throw new Error("aggregateSource: invalid item");
        }
        const client = new IdentityNowClient(item.tenantId, item.tenantName);
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Aggregation of ${type} from ${item.label}`,
            cancellable: false
        }, async (progress, token) => {
            let job: any;
            let jobType: AggregationJob;
            if ("accounts"=== type) {

                job = await client.startAccountAggregation(item.ccId, disableOptimization)
                    .catch(error=>{
                        console.error(error);
                    });
                jobType = AggregationJob.CLOUD_ACCOUNT_AGGREGATION;
            } else {
                job = await client.startEntitlementAggregation(item.ccId);
                jobType = AggregationJob.ENTITLEMENT_AGGREGATION;
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


    public async resetSource(item: SourceTreeItem, skip: string | null = null): Promise<void> {
        console.log("> resetSource", item);
        // assessing that item is a SourceTreeItem
        if (item === undefined || !(item instanceof SourceTreeItem)) {
            console.log("WARNING: resetSource: invalid item", item);
            throw new Error("aggregateSource: invalid item");
        }
        let skipping = "";
        if (!!skip) {
            skipping = ` skipping ${skip}`;
        }
        const response = await vscode.window.showWarningMessage(
            `Are you sure you want to reset ${item.label}${skipping}?`,
            { modal: true },
            ...["Yes", "No"]
        );
        if (response !== "Yes") {
            console.log("< resetSource: no reset");
            return;
        }

        const client = new IdentityNowClient(item.tenantId, item.tenantName);
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Reset of ${item.label}${skipping}`,
            cancellable: false
        }, async (progress, token) => {
            let job = null;
            try {
                job = await client.resetSource(item.ccId, skip);
            } catch (err) {
                vscode.window.showErrorMessage('' + err);
                return;
            }
            console.log("job =", job);

            let task: any | null = null;
            do {
                await delay(5000);
                task = await client.getAggregationJob(item.ccId, job.id, AggregationJob.SOURCE_RESET);
                console.log("task =", task);

            } while (task !== undefined && task.status === "PENDING");
            if (task !== undefined) {
                if (task.status === "SUCCESS") {
                    vscode.window.showInformationMessage(`Source ${task.object.displayName} successfully reset${skipping}`);
                } else if (task.status === "WARNING") {
                    vscode.window.showWarningMessage(
                        `Warning during reset of ${task.object.displayName}: ${task.details?.messages?.Warn}`);
                } else {
                    vscode.window.showErrorMessage(
                        `Reset of ${task.object.displayName} failed: ${task.status}: ${task.details?.messages?.Error}`);
                }
            };
        });
    }

    public async evaluateTransform(item: SourceTreeItem): Promise<void> {
        console.log("> NewTransformCommand.evaluate", item);

        this.transformEvaluator.evaluate(item);
    };
}