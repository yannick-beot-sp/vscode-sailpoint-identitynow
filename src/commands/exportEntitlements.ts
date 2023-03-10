import * as vscode from 'vscode';
import { SourceTreeItem } from '../models/IdentityNowTreeItem';
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { BaseCSVExporter } from './BaseExporter';
import { Entitlement } from '../models/Entitlements';
import EntitlementPaginator from './EntitlementPaginator';


export class EntitlementExporterCommand {


    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {
        console.log("> EntitlementExporter.execute");

        if (node === undefined) {
            console.error("WARNING: EntitlementExporter: invalid item", node);
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

        const exporter = new EntitlementExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.id as string,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class EntitlementExporter extends BaseCSVExporter<Entitlement> {

    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        sourceId: string,
        path: string

    ) {
        super("entitlements",
            tenantId,
            tenantName,
            tenantDisplayName,
            sourceId,
            path);
    }
    
    protected async exportFile(

        task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> BaseEntitlementExporter.exportFile");
        const headers = [
            "attributeName", "attributeValue", "displayName", "description", "privileged", "schema"
        ];
        const paths = [
            "attribute", "value", "name", "description", "sourceSchemaObjectType"
        ];
        const unwindablePaths: string[] = [];

        const iterator = new EntitlementPaginator(this.client, this.sourceId);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token);
    }

}




