import * as vscode from 'vscode';
import { IdentityNowResourceTreeItem, SourceTreeItem } from '../models/IdentityNowTreeItem';
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { ensureFolderExists } from '../utils/fileutils';
import { BaseCSVExporter } from './BaseExporter';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { Entitlement } from '../models/Entitlements';
import EntitlementPaginator from './EntitlementPaginator';


export class EntitlementExporter extends BaseCSVExporter<Entitlement> {
    constructor() {
        super("entitlements");
    }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: IdentityNowResourceTreeItem) {

        console.log("> EntitlementExporter.execute");


        if (node === undefined || !(node instanceof SourceTreeItem)) {
            console.log("WARNING: EntitlementExporter: invalid item", node);
            throw new Error("EntitlementExporter: invalid item");
        }

        const proposedPath = PathProposer.getEntitlementReportFilename(
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

        console.log("> BaseEntitlementExporter.exportFile");
        const headers = [
            "attributeName","attributeValue","displayName","description","privileged","schema"
        ];
        const paths = [
            "attribute","value","name","description","sourceSchemaObjectType"
        ];
        const unwindablePaths: string[] = [];
       
        const iterator = new EntitlementPaginator(client, sourceId);
        await this.writeData(filePath, headers, paths, unwindablePaths, iterator);
    }

}




