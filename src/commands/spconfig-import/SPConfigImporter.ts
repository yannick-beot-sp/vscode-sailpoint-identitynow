import * as vscode from 'vscode';
import { ExportOptions } from '../../models/ExportOptions';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { delay } from '../../utils';
import { ObjectTypeItem } from '../../models/ConfigQuickPickItem';
import { ImportedObject } from '../../models/JobStatus';
import { ObjectPickItem } from '../../models/ObjectPickItem';
import { OBJECT_TYPE_ITEMS } from '../../models/ObjectTypeQuickPickItem';

const ALL: vscode.QuickPickItem = {
    label: "Import everything",
    picked: true
};

const PICK_AND_CHOOSE: vscode.QuickPickItem = {
    label: "Choose what to import"
};


/**
 * Base class for all importer
 */
export class SPConfigImporter {
    private client!: IdentityNowClient;

    constructor(
        private readonly tenantId: string,
        private readonly tenantName: string,
        private readonly tenantDisplayName: string,
        private readonly importOptions: ExportOptions = {},
        private data: string

    ) {
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
    }

    /**
     * Create the import job and follow-up the result
     */
    public async importConfig(): Promise<void> {


        let message = "";
        const importOptions = this.importOptions;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing configuration from ${this.tenantName}...`,
            cancellable: false
        }, async (task, token) => {
            try {
                const jobId = await this.client.startImportJob(this.data, importOptions);
                let jobStatus: any;
                do {
                    await delay(1000);
                    jobStatus = await this.client.getImportJobStatus(jobId);
                    console.log({ jobStatus });
                } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

                if (jobStatus.status !== "COMPLETE") {
                    throw new Error("Could not import config: " + jobStatus.message);
                }

                const importJobresult: any = await this.client.getImportJobResult(jobId);
                for (const key in importJobresult.results) {
                    if (message.length > 0) {
                        message += ", ";
                    }
                    message += importJobresult.results[key].importedObjects
                        .map((x: ImportedObject) => `${x.name} (${key})`)
                        .join(", ");
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Could not import data: ${error.message}`);
                throw error;
            }
        }).then(async () => {
            await vscode.window.showInformationMessage(
                `Successfully imported configuration to ${this.tenantDisplayName}: ${message}`);
        });
    }


}
