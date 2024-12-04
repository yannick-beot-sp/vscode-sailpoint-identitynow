import * as vscode from 'vscode';
import { CSVWriter } from '../services/CSVWriter';
import { ensureFolderExists } from '../utils/fileutils';
import { openPreview } from '../utils/vsCodeHelpers';

export class Exporter<T> {
    private unwindablePaths: string[] = []
    private paginator: AsyncIterable<T>
    private progressMessage: string
    private successfulMessage: string
    private mapper?: (x: T) => any | Promise<any>
    private headers: string[]
    private paths: string[]
    private filePath: string
    protected delimiter: string = ","


    constructor(params: {
        unwindablePaths: string[],
        paginator: AsyncIterable<T>,
        progressMessage: string,
        successfulMessage: string,
        mapper?: (x: T) => any | Promise<any>,
        headers: string[],
        paths: string[],
        filePath: string
    }) {
        Object.assign(this, params);
    }

    /**
     * Will display a progress bar for the export
     */
    public async export(): Promise<void> {

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: this.progressMessage,
            cancellable: true
        }, async (task, token) =>
            await this.writeData(task, token)
        )
            .then(async () => {
                vscode.window.showInformationMessage(
                    this.successfulMessage
                );
                openPreview(this.filePath, "csv")
            });
    }
    protected async writeData(
        task: any,
        token: vscode.CancellationToken
        
    ) {
        ensureFolderExists(this.filePath);
        const csvWriter = new CSVWriter(
            this.filePath,
            this.headers,
            this.paths,
            this.unwindablePaths,
            [],
            this.delimiter);

        for await (let data of this.paginator) {
            // Not using json2csv transforms as these transforms are non-async method, so very limited
            if (this.mapper) {
                data = await this.mapper(data)
            }

            await csvWriter.write([data]);
            
            if (token.isCancellationRequested) {
                break;
            }
        }
        await csvWriter.end();
    }
}