import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem, SourceTreeItem } from '../models/IdentityNowTreeItem';
import { Schema } from '../models/Schema';
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { ensureFolderExists } from '../utils/fileutils';
import { BaseCSVExporter } from './BaseExporter';
import AccountPaginator from './AccountPaginator';
import { Account } from '../models/Account';
import { IdentityNowClient } from '../services/IdentityNowClient';


export class AccountExporter extends BaseCSVExporter<Account> {
    constructor() {
        super("accounts");
    }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: IdentityNowResourceTreeItem) {

        console.log("> AccountExporter.execute");


        if (node === undefined || !(node instanceof SourceTreeItem)) {
            console.log("WARNING: AccountExporter: invalid item", node);
            throw new Error("AccountExporter: invalid item");
        }

        const proposedPath = PathProposer.getAccountReportFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        );
        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );
        if (filePath === undefined) {
            return;
        }

        ensureFolderExists(filePath);

        await this.exportFileWithProgression(node.tenantName, node.tenantDisplayName, node.tenantId, filePath, node.id as string);
    }

    protected async exportFile(
        client: IdentityNowClient,
        tenantName: string,
        tenantDisplayName: string,
        sourceId: string,
        filePath: string,
        task: any, token: vscode.CancellationToken): Promise<void> {

        console.log("> BaseAccountExporter.exportFile");
        const schemas = await client.getResource(`/v3/sources/${sourceId}/schemas`);
        if (schemas === null || !Array.isArray(schemas)) {
            console.error("Could not retrieve account schema");
            throw new Error("Could not retrieve account schema");
        }
        const schema = schemas.find(x => x.name === 'account') as Schema;

        const headers: string[] = [];
        const paths: string[] = [];
        const unwindablePaths: string[] = [];
        schema.attributes.forEach(x => {
            headers.push(x.name);
            const path = 'attributes.' + x.name;
            paths.push(path);
            if (x.isMulti) { unwindablePaths.push(path); }
        });

        const iterator = new AccountPaginator(client, sourceId);
        await this.writeData(filePath, headers, paths, unwindablePaths, iterator);
    }

}




