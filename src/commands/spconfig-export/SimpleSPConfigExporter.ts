import { ObjectExportImportOptions, ExportPayloadIncludeTypesEnum as ExportPayloadIncludeTypes, SpConfigExportResults } from 'sailpoint-api-client/dist/sp_config/api.js';
import * as vscode from 'vscode';
import { ISCClient } from '../../services/ISCClient.js';
import { delay } from '../../utils.js';

/**
 * Simplified version of SPConfigExporter
 */
export class SimpleSPConfigExporter {
    constructor(
        private client: ISCClient,
        private readonly tenantDisplayName: string,
        private readonly options: {
            [key: string]: ObjectExportImportOptions;
        },
        private objectTypes: ExportPayloadIncludeTypes[] = [],
        private readonly progressTitle?: string
    ) {
    }

    /**
     * Will display a progress bar for the export
     */
    public async exportConfigWithProgression(): Promise<SpConfigExportResults | null> {


        const data = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: this.progressTitle ?? `Exporting configuration from ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            return await this.exportConfig(task, token);
        });
        return data;
    }

    private async exportConfig(task: any, token: vscode.CancellationToken): Promise<SpConfigExportResults | null> {

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
