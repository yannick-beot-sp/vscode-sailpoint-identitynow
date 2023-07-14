import * as vscode from 'vscode';
import { ExportOptions } from '../../models/ExportOptions';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { delay } from '../../utils';
import { ImportJobResults, ImportedError } from '../../models/JobStatus';
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
        const importOptions = this.importOptions;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing configuration to ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            const jobId = await this.client.startImportJob(this.data, importOptions);
            let jobStatus: any;
            do {
                await delay(1000);
                jobStatus = await this.client.getImportJobStatus(jobId);
                console.log({ jobStatus });
            } while (jobStatus.status === "NOT_STARTED" || jobStatus.status === "IN_PROGRESS");

            // if (jobStatus.status !== "COMPLETE") {
            //     throw new Error(jobStatus.message);
            // }

            const importJobresult = await this.client.getImportJobResult(jobId);
            return importJobresult;

        },).then(async (importJobresult) => {
            const errors = [] as string[];
            let objectType: keyof typeof importJobresult.results;
            for (objectType in importJobresult.results) {
                importJobresult.results[objectType]?.errors
                    .forEach((element: ImportedError) => {
                        errors.push(element.detail.exceptionMessage);
                    });
            }

            if (errors.length > 0) {
                let message = "Could not import config: ";
                message += errors.join(". ");
                message += ". ";
                message += this.formatImportedObjects(importJobresult);              
                vscode.window.showErrorMessage(message);

            } else {
                const message = this.formatImportedObjects(importJobresult);
                // At this moment it is not possible to have a multi-line notification
                await vscode.window.showInformationMessage(
                    `Successfully imported configuration to ${this.tenantDisplayName}. ${message}`);
            }
        }, (error) => {
            vscode.window.showErrorMessage(`Could not import config: ${error.message}`);
        });
    }


    private formatImportedObjects(importJobresult: ImportJobResults): string {
        let message = "";
        let objectType: keyof typeof importJobresult.results;

        for (objectType in importJobresult.results) {
            if ((importJobresult.results[objectType]?.importedObjects ?? []).length > 0) {

                message += `Successfully imported ${this.mapObjectTypeToLabel(objectType)}: `;
                message += importJobresult.results[objectType]?.importedObjects.map(x => x.name).join(', ');
                message += ". ";
            }
        }
        return message;
    }

    private mapObjectTypeToLabel(objectType: string): string {
        return OBJECT_TYPE_ITEMS.find(x => x.objectType === objectType)?.label ?? "UNKOWN";
    }


}