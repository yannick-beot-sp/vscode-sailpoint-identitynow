import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem, SourceTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { delay } from '../utils';
import * as fs from 'fs';
import { withQuery } from '../utils/UriUtils';
import { CSVWriter } from '../services/CSVWriter';
import { Schema } from '../models/Schema';
import { off } from 'process';
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { ensureFolderExists } from '../utils/fileutils';

/**
 * Base class for all importer
 */
export abstract class BaseCSVExporter<T> {




    constructor(protected objectType: string) { }

    /**
     * Will display a progress bar for the export
     */
    public async exportFileWithProgression(
        tenantName: string,
        tenantDisplayName: string,
        tenantId: string,
        filePath: string,
        sourceId: string
    ): Promise<void> {

        const client = new IdentityNowClient(tenantId, tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting ${this.objectType} from ${tenantName}...`,
            cancellable: false
        }, async (task, token) => await this.exportFile(client, tenantName, tenantDisplayName, sourceId, filePath, task, token))
            .then(async () =>
                await vscode.window.showInformationMessage(
                    `Successfully exported ${this.objectType} from ${tenantName}`
                ));
    }

    protected async writeData(
        filePath: string,
        headers: string[],
        paths: string[],
        unwindablePaths: string[],
        iterator: AsyncIterable<T[]>) {

        const csvWriter = new CSVWriter(
            filePath,
            headers,
            paths,
            unwindablePaths);

        for await (const data of iterator) {
            await csvWriter.write(data);
        }
        csvWriter.end();
    }

    protected abstract exportFile(
        client: IdentityNowClient,
        tenantName: string,
        tenantDisplayName: string,
        sourceId: string,
        filePath: string,
        task: any, token: vscode.CancellationToken): Promise<void>;
}






