import * as vscode from 'vscode';

import * as fs from 'fs';
import path = require('path');

import { IdentityNowClient } from '../../services/IdentityNowClient';
import { delay } from '../../utils';
import { ensureFolderExists } from '../../utils/fileutils';
import { PathProposer } from '../../services/PathProposer';

/**
 * Class use to export SP-Config
 */
export class SPConfigExporter {
    private client!: IdentityNowClient;
    constructor(
        private readonly tenantId: string,
        private readonly tenantName: string,
        private readonly tenantDisplayName: string,
        private target: string,
        private readonly options:any,
        private objectTypes: string[] = [],
        private readonly exportSingle = true
        ) { 
            this.client = new IdentityNowClient(this.tenantId, this.tenantName);
        }

    /**
     * Will display a progress bar for the export
     */
    public async exportConfigWithProgression(): Promise<void> {

        
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting configuration from ${this.tenantName}...`,
            cancellable: false
        }, async (task, token) => await this.exportConfig(task, token))
            .then(async () =>
                vscode.window.showInformationMessage(
                    `Successfully exported configuration from ${this.tenantDisplayName}`
                ));
    }

    private async exportConfig(task: any, token: vscode.CancellationToken): Promise<void> {
        if (!this.target) {
            return;
        }

        const jobId = await this.client.startExportJob(
            this.objectTypes,
            this.options);

        let jobStatus: any;
        do {
            await delay(1000);
            jobStatus = await this.client.getExportJobStatus(jobId);
            console.log({ jobStatus });
        } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

        if (jobStatus.status !== "COMPLETE") {
            throw new Error("Could not export config: " + jobStatus.message);
        }

        const data = await this.client.getExportJobResult(jobId);
        if (this.exportSingle) {
            console.log('Writing to ', this.target);
            ensureFolderExists(this.target);
            fs.writeFileSync(this.target, JSON.stringify(data, null, 2), { encoding: "utf8" });
        } else {
            for (let obj of data.objects) {
                const targetFilename = PathProposer.getSPConfigMultipeFileFilename(
                    this.tenantName as string,
                    this.tenantDisplayName as string,
                    obj.self.type,
                    obj.self.name
                );

                const targetFilepath = path.join(this.target, targetFilename);
                ensureFolderExists(targetFilepath);
                console.log('Writing to ', targetFilepath);
                fs.writeFileSync(targetFilepath, JSON.stringify(obj.object, null, 2), { encoding: "utf8" });
            }
        }
    }
}