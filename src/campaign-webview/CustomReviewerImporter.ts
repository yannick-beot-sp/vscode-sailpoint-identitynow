import * as vscode from 'vscode';
import * as tmp from "tmp";

import { ISCClient } from '../services/ISCClient';
import { CSVLogWriter, CSVLogWriterLogType } from '../services/CSVLogWriter';
import { CSVReader } from '../services/CSVReader';
import { UserCancelledError } from '../errors';

interface CustomReviewerImportResult {
    success: number
    error: number
}

interface CustomReviewerRecord {
    reviewerAttribute: string,
    reviewerValue: string,
    accessType: string,
    accessSelectorType: string,
    accessSelector: string
}

export class CustomReviewerImporter {
    readonly client: ISCClient;
    readonly logFilePath: string;
    readonly logWriter: CSVLogWriter;

    constructor(
        private tenantId: string,
        private tenantName: string,
        private campaignName: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);

        this.logFilePath = tmp.tmpNameSync({
            prefix: 'import-roles',
            postfix: ".log",
        });

        try {
            this.logWriter = new CSVLogWriter(this.logFilePath);
        } catch (_exc: any) {
            console.error(_exc);
            throw _exc;
        }
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing custom reviewer configuration for campaign ${this.campaignName}...`,
            cancellable: true
        }, async (task, token) =>
            await this.importFile(task, token)
        );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> CustomReviewerImporter.importFile");
        const csvReader = new CSVReader<CustomReviewerRecord>(this.fileUri.fsPath);
        console.log(`> CustomReviewerImporter.importFile: Importing file from ${this.fileUri.fsPath} for campaign ${this.campaignName}`);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        let processedLines = 0;

        const result: CustomReviewerImportResult = {
            success: 0,
            error: 0
        };

        try {
            await csvReader.processLine(async (data: CustomReviewerRecord) => {
                if (token.isCancellationRequested) {
                    throw new UserCancelledError();
                }

                processedLines++

                try {
                    result.success++;
                } catch (error: any) {
                    result.error++;
                    console.log(`> CustomReviewerImporter.importFile: Unable to process Custom Reviewer line: '${error.message}' in ISC`);
                }
            });
        } catch { }
        const message = `${processedLines} line(s) processed. ${result.success} sucessfully processed. ${result.error} error(s).`;

        if (result.error === processedLines) {
            vscode.window.showErrorMessage(message);
        } else if (result.error > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }

        try {
            this.logWriter?.end();
        } catch (_exc) {
            // do nothing hopefully
        }
    }

    private async writeLog(csvLine: number | string | null, objectName: string, type: CSVLogWriterLogType, message: string) {
        let logMessage = '';
        if (this.logWriter) {
            if (!csvLine) {
                csvLine = '0';
            }
            const lnStr = '' + csvLine; // Convert to string 'old skool casting ;-)' ;-)
            logMessage = `[CSV${lnStr.padStart(8, '0')}][${objectName}] ${message}`;
            await this.logWriter.writeLine(type, logMessage);
        }
    }
}