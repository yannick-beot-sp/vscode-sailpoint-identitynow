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
abstract class BaseAccountExporter {
    tenantName: string | undefined;
    tenantDisplayName: string | undefined;
    tenantId: string | undefined;
    filePath: string | undefined;
    client!: IdentityNowClient;
    sourceId!: string;

    constructor() { }

    init(): void {
        // this.data = "";
    }


    /**
     * Will display a progress bar for the export
     */
    public async exportFileWithProgression(): Promise<void> {
        if (!this.tenantId || !this.tenantName) {
            throw new Error("Invalid tenant info");
        }
        this.client = new IdentityNowClient(this.tenantId, this.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Exporting accounts from ${this.tenantName}...`,
            cancellable: false
        }, async (task, token) => await this.exportFile(task, token))
            .then(async () =>
                await vscode.window.showInformationMessage(
                    `Successfully exported accounts from ${this.tenantName}`
                ));
    }

    private async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {

        console.log("> BaseAccountExporter.exportFile");
        const schemas = await this.client.getResource(`/v3/sources/${this.sourceId}/schemas`);
        if (schemas === null || !Array.isArray(schemas)) {
            console.error("Could not retrieve account schema");
            throw new Error("Could not retrieve account schema");
        }
        const schema = schemas.find(x=>x.name==='account') as Schema;
        const headers: string[] = [];
        const paths: string[] = [];
        const unwindablePaths: string[] = [];

        schema.attributes.forEach(x => {
            headers.push(x.name);
            const path = 'attributes.' + x.name;
            paths.push(path);
            if (x.isMulti) { unwindablePaths.push(path); }
        });
        const csvWriter = new CSVWriter(this.filePath as string, headers, paths, unwindablePaths);

        const count = await this.client.getAccountCountBySource(this.sourceId);
        console.log(count, "accounts found in", this.sourceId);

        let offset = 0;
        const limit = 250;
        do {
            const data = await this.client.getAccountsBySource(this.sourceId, offset, limit);
            await csvWriter.write(data);
            offset += limit;
        } while (offset < count);
        csvWriter.end();
    }
}

export class AccountExporter extends BaseAccountExporter {
    async execute(node?: IdentityNowResourceTreeItem) {

        console.log("> AccountExporter.execute");
        this.init();

        if (node === undefined || !(node instanceof SourceTreeItem)) {
            console.log("WARNING: AccountExporter: invalid item", node);
            throw new Error("AccountExporter: invalid item");
        }

        this.tenantId = node.tenantId;
        this.tenantName = node.tenantName;
        this.tenantDisplayName = node.tenantDisplayName;
        this.sourceId = node.id as string;

        const proposedPath = PathProposer.getAccountReportFilename(
            this.tenantName,
            this.tenantDisplayName,
            node.label as string
        );
        this.filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );
        if (this.filePath === undefined) {
            return;
        }

        ensureFolderExists(this.filePath);
        
        await this.exportFileWithProgression();
    }

}




