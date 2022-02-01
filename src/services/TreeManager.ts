import { authentication, window, commands, ProgressLocation } from "vscode";
import { SourceTreeItem, TenantTreeItem } from "../models/IdentityNowTreeItem";
import { delay } from "../utils";
import { IdentityNowDataProvider } from "../views/IdentityNowDataProvider";
import { SailPointIdentityNowAuthenticationProvider } from "./AuthenticationProvider";
import { AggregationJob, IdentityNowClient } from "./IdentityNowClient";
import { TenantService } from "./TenantService";

export class TreeManager {

    constructor(
        private readonly dataProvider: IdentityNowDataProvider,
        private readonly tenantService: TenantService,
        private readonly authProvider: SailPointIdentityNowAuthenticationProvider
    ) { }

    public async removeTenant(item: TenantTreeItem): Promise<void> {
        console.log("> removeTenant", item);
        // assessing that item is a TenantTreeItem
        if (item === undefined || !(item instanceof TenantTreeItem)) {
            console.log("WARNING: removeTenant: invalid item", item);
            throw new Error("removeTenant: invalid item");
        }
        const tenantName = item.tenantName || "";
        const response = await window.showInformationMessage(
            `Are you sure you want to delete tenant ${tenantName}?`,
            ...["Yes", "No"]
        );
        if (response !== "Yes") {
            console.log("< removeTenant: no delete");
        }

        const session = await authentication.getSession(SailPointIdentityNowAuthenticationProvider.id, [tenantName], { createIfNone: false });
        if (session !== undefined) {
            this.authProvider.removeSession(session.id);
        }
        this.tenantService.removeTenant(tenantName);
        commands.executeCommand("vscode-sailpoint-identitynow.refresh-tenants");
        window.showInformationMessage(`Successfully deleted tenant ${tenantName}`);
    }

    public async aggregateSource(item: SourceTreeItem, disableOptimization = false): Promise<void> {
        console.log("> aggregateSource", item, disableOptimization);
        // assessing that item is a SourceTreeItem
        if (item === undefined || !(item instanceof SourceTreeItem)) {
            console.log("WARNING: aggregateSource: invalid item", item);
            throw new Error("aggregateSource: invalid item");
        }
        const client = new IdentityNowClient(item.tenantName);
        window.withProgress({
            location: ProgressLocation.Notification,
            title: `Aggregation of ${item.label}`,
            cancellable: false
        }, async (progress, token) => {
            const job = await client.startAggregation(item.ccId, disableOptimization);
            console.log("job =", job);
            let task: any | null = null;
            do {
                await delay(5000);
                task = await client.getAggregationJob(item.ccId, job.task.id);
                console.log("task =", task);

            } while (task !== null && task.status === "PENDING");
            if (task !== null) {
                if (task.status === "SUCCESS") {
                    window.showInformationMessage(`Source ${task.object.displayName} successfully aggregated`);
                } else if (task.status === "WARNING") {
                    window.showWarningMessage(
                        `Warning during aggregation of ${task.object.displayName}: ${task.details?.messages?.Warn}`);
                } else {
                    window.showErrorMessage(
                        `Aggregation of ${task.object.displayName} failed: ${task.status}: ${task.details?.messages?.Error}`);
                }
            };
        });
    }

    public async resetSource(item: SourceTreeItem): Promise<void> {
        console.log("> resetSource", item);
        // assessing that item is a SourceTreeItem
        if (item === undefined || !(item instanceof SourceTreeItem)) {
            console.log("WARNING: resetSource: invalid item", item);
            throw new Error("aggregateSource: invalid item");
        }
        const client = new IdentityNowClient(item.tenantName);
        window.withProgress({
            location: ProgressLocation.Notification,
            title: `Reset of ${item.label}`,
            cancellable: false
        }, async (progress, token) => {
            let job = null;
            try {
                job = await client.resetSource(item.ccId);
            } catch (err) {
                window.showErrorMessage('' + err);
                return;
            }
            console.log("job =", job);

            let task: any | null = null;
            do {
                await delay(5000);
                task = await client.getAggregationJob(item.ccId, job.id, AggregationJob.SOURCE_RESET);
                console.log("task =", task);

            } while (task !== null && task.status === "PENDING");
            if (task !== null) {
                if (task.status === "SUCCESS") {
                    window.showInformationMessage(`Source ${task.object.displayName} successfully reset`);
                } else if (task.status === "WARNING") {
                    window.showWarningMessage(
                        `Warning during reset of ${task.object.displayName}: ${task.details?.messages?.Warn}`);
                } else {
                    window.showErrorMessage(
                        `Reset of ${task.object.displayName} failed: ${task.status}: ${task.details?.messages?.Error}`);
                }
            };
        });
    }
}