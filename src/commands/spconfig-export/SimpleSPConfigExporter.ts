import { ObjectExportImportOptionsBeta, ExportPayloadBetaIncludeTypesBeta, SpConfigExportResultsBeta } from 'sailpoint-api-client';
import * as vscode from 'vscode';
import { ISCClient } from '../../services/ISCClient';
import { delay } from '../../utils';

/**
 * Simplified version of SPConfigExporter
 */
export class SimpleSPConfigExporter {
    constructor(
        private client: ISCClient,
        private readonly tenantDisplayName: string,
        private readonly options: {
            [key: string]: ObjectExportImportOptionsBeta;
        },
        private objectTypes: ExportPayloadBetaIncludeTypesBeta[] = []
    ) {
    }

    /**
     * Will display a progress bar for the export
     */
    public async exportConfigWithProgression(): Promise<SpConfigExportResultsBeta | null> {


        const data = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting configuration from ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            return await this.exportConfig(task, token);
        });
        return data;
    }

    private async exportConfig(task: any, token: vscode.CancellationToken): Promise<SpConfigExportResultsBeta | null> {

        const jobId = await this.client.startExportJob(
            this.objectTypes,
            this.options);

        let jobStatus: any;
        do {
            if (token.isCancellationRequested) {
                return null;
            }
            await delay(1000);
            jobStatus = await this.client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }
        if (token.isCancellationRequested) {
            return null;
        }
        const data = await this.client.getExportJobResult(jobId);
        return data;
    }
}
