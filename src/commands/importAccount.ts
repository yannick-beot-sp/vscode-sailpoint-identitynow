import * as vscode from 'vscode';
import { SourceTreeItem } from "../models/IdentityNowTreeItem";
import { AggregationJob, IdentityNowClient } from '../services/IdentityNowClient';
import { delay } from '../utils';

class AccountImporter {
    readonly client: IdentityNowClient;
    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private sourceName: string,
        private sourceId: string,
        private sourceCCId: number,
        private fileUri: vscode.Uri
    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing accounts to ${this.sourceName}...`,
            cancellable: false
        }, async (task, token) =>
            await this.importFile(task, token)
        );
        //     .then(async () => {
        //         vscode.window.showInformationMessage(
        //             `Successfully imported accounts to ${this.sourceName}`
        //         );
        //     });
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccountImporter.importFile");
        const source = await this.client.getSourceById(this.sourceId);

        let job = await this.client.startImportAccount(
            this.sourceCCId,
            source.connectorAttributes.deleteThresholdPercentage,
            this.fileUri.fsPath
        );

        console.log("job =", job);
        
        do {
            await delay(5000);
            job = await this.client.getAggregationJob(this.sourceCCId, job.task.id, AggregationJob.CLOUD_ACCOUNT_AGGREGATION);
            console.log("job =", job);

        } while (job !== null && job.status === "PENDING");
        if (job !== null) {
            if (job.status === "SUCCESS") {
                vscode.window.showInformationMessage(`Source ${job.object.displayName} successfully aggregated`);
            } else if (job.status === "WARNING") {
                vscode.window.showWarningMessage(
                    `Warning during aggregation of ${job.object.displayName}: ${job.details?.messages?.Warn}`);
            } else {
                vscode.window.showErrorMessage(
                    `Aggregation of ${job.object.displayName} failed: ${job.status}: ${job.details?.messages?.Error}`);
            }
        };
    }
}

/**
 * Entrypoint for the command to import accounts from the tree view/from a node
 */
export class AccountImportNodeCommand {

    async execute(node?: SourceTreeItem): Promise<void> {
        console.log("> AccountImportNodeCommand.execute");
        if (node === undefined) {
            console.error("AccountImportNodeCommand: invalid item", node);
            throw new Error("AccountImportNodeCommand: invalid item");
        }

        const fileUri = await vscode.window.showOpenDialog({
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: false,
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'CSV files': ['csv'],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'All files': ['*']
            }
        });

        if (fileUri === undefined || fileUri.length === 0) { return; }

        const accountImporter = new AccountImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            node.ccId,
            fileUri[0]
        );
        await accountImporter.importFileWithProgression();
    }
}