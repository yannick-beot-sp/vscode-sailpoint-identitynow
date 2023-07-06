import * as vscode from 'vscode';
import { BaseCSVExporter } from "./BaseExporter";
import { RolesTreeItem } from '../models/IdentityNowTreeItem';
import { askFile } from '../utils/vsCodeHelpers';
import { PathProposer } from '../services/PathProposer';
import { Role } from '../models/Role';
import RolePaginator from './paginator/RolePaginator';

export class RoleExporterCommand {
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: RolesTreeItem) {
        console.log("> AccessProfileExporterCommand.execute");

        if (node === undefined) {
            console.error("WARNING: RoleExporterCommand: invalid item", node);
            throw new Error("RoleExporterCommand: invalid item");
        }

        const proposedPath = PathProposer.getGenericCSVFilename(
            node.tenantName,
            node.tenantDisplayName,
            "Roles"
        );

        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );

        if (filePath === undefined) {
            return;
        }

        const exporter = new RoleExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class RoleExporter extends BaseCSVExporter<Role> {
    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        path: string
    ) {
        super("roles",
            tenantId,
            tenantName,
            tenantDisplayName,
            '', // Base exported forces sourceId, but we do not need to use it in here, so leaving it blank.
            path);
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleExporter.exportFile");
        const headers = [
            "name", /*"description",*/ "enabled", "requestable"
        ];
        const paths = [
            "name", /*"description",*/ "enabled", "requestable"
        ];
        const unwindablePaths: string[] = [];

        const iterator = new RolePaginator(this.client);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token);
    }
}