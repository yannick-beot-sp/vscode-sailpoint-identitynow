import * as vscode from 'vscode';
import { ISCClient } from '../../services/ISCClient';
import { delay } from '../../utils';
import { IMPORTABLE_OBJECT_TYPE_ITEMS } from '../../models/ObjectTypeQuickPickItem';
import { ImportOptionsBeta, SpConfigJobBetaStatusBeta } from 'sailpoint-api-client';
import { ImportJobResults } from '../../models/JobStatus';

/**
 * Base class for all importer
 */
export class SPConfigImporter {
    private client!: ISCClient;

    constructor(
        private readonly tenantId: string,
        private readonly tenantName: string,
        private readonly tenantDisplayName: string,
        private readonly importOptions: ImportOptionsBeta = {},
        private data: string

    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);
    }

    /**
     * Create the import job and follow-up the result
     */
    public async importConfig(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing configuration to ${this.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            const jobId = await this.client.startImportJob(this.data, this.importOptions);
            let jobStatus: any;
            do {
                await delay(1000);
                jobStatus = await this.client.getImportJobStatus(jobId);
                console.log({ jobStatus });
            } while (jobStatus.status === SpConfigJobBetaStatusBeta.NotStarted || jobStatus.status === SpConfigJobBetaStatusBeta.InProgress);

            const importJobresult = await this.client.getImportJobResult(jobId);
            const result = { ...importJobresult, ...jobStatus };
            return result;

        },).then(async (importJobresult) => {
            console.log("importJobresult=", importJobresult);
            const errors = [] as string[];
            let objectType: keyof typeof importJobresult.results;
            for (objectType in importJobresult.results) {
                importJobresult.results[objectType]?.errors
                    .forEach((element) => {
                        errors.push(element.detail.exceptionMessage ?? element.text);
                    });
            }

            if (errors.length > 0) {
                // Errors are detailed
                let message = "Could not import config: ";
                message += errors.join(". ");
                message += ". ";
                message += this.formatImportedObjects(importJobresult);
                vscode.window.showErrorMessage(message);
            } else if (importJobresult.status === "FAILED") {
                // If error but not details in the job result, takes the initial message
                vscode.window.showErrorMessage(importJobresult.message);
            } else {
                // It is a success
                const message = this.formatImportedObjects(importJobresult);
                // At this moment it is not possible to have a multi-line notification
                vscode.window.showInformationMessage(
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
        return IMPORTABLE_OBJECT_TYPE_ITEMS.find(x => x.objectType === objectType)?.label ?? "UNKOWN";
    }


}
