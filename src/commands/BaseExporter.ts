import * as vscode from 'vscode';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { CSVWriter } from '../services/CSVWriter';
import { ensureFolderExists } from '../utils/fileutils';

/**
 * Base class for all importer
 */
export abstract class BaseCSVExporter<T> {

    readonly client: IdentityNowClient;


    constructor(protected objectType: string,
        protected tenantId: string,
        protected tenantName: string,
        protected tenantDisplayName: string,
        protected sourceId: string,
        protected filePath: string,
        protected delimiter: string = ","
    ) {
        this.client = new IdentityNowClient(tenantId, tenantName);
    }

    /**
     * Will display a progress bar for the export
     */
    public async exportFileWithProgression(): Promise<void> {

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting ${this.objectType} from ${this.tenantName}...`,
            cancellable: true
        }, async (task, token) =>
            await this.exportFile(task, token)
        )
            .then(async () => {
                vscode.window.showInformationMessage(
                    `Successfully exported ${this.objectType} from ${this.tenantName}`
                );
                const document = await vscode.workspace.openTextDocument(vscode.Uri.file(this.filePath));
                vscode.window.showTextDocument(document);
            });
    }

    /**
     * 
     * @param headers Headers of CSV
     * @param paths Dotted path 
     * @param unwindablePaths 
     * @param iterator 
     */
    protected async writeData(
        headers: string[],
        paths: string[],
        unwindablePaths: string[],
        iterator: AsyncIterable<T[]>,
        task: any,
        token: vscode.CancellationToken,
        mapper?: (x: T) => any | Promise<any>,
    ) {
        ensureFolderExists(this.filePath);
        const csvWriter = new CSVWriter(
            this.filePath,
            headers,
            paths,
            unwindablePaths,
            [],
            this.delimiter);

        for await (let data of iterator) {
            // Not using json2csv transforms as these transforms are non-async method, so very limited
            if (mapper) {
                data = await Promise.all(data.map(x => mapper(x)));
            }
            await csvWriter.write(data);
            if (token.isCancellationRequested) {
                break;
            }
        }
        await csvWriter.end();
    }

    protected abstract exportFile(task: any, token: vscode.CancellationToken): Promise<void>;
}






