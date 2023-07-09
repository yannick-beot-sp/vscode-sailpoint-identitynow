import * as vscode from 'vscode';
import { BaseCSVExporter } from "./BaseExporter";
import { AccessProfile } from '../models/AccessProfile';
import AccessProfilePaginator from './paginator/AccessProfilePaginator';
import { AccessProfilesTreeItem } from '../models/IdentityNowTreeItem';
import { askFile } from '../utils/vsCodeHelpers';
import { PathProposer } from '../services/PathProposer';

import { flatten } from '@json2csv/transforms';

export class AccessProfileExporterCommand {
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: AccessProfilesTreeItem) {
        console.log("> AccessProfileExporterCommand.execute");

        if (node === undefined) {
            console.error("WARNING: AccessProfileExporterCommand: invalid item", node);
            throw new Error("AccessProfileExporterCommand: invalid item");
        }

        const proposedPath = PathProposer.getGenericCSVFilename(
            node.tenantName,
            node.tenantDisplayName,
            "AccessProfile"
        );

        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );

        if (filePath === undefined) {
            return;
        }

        const exporter = new AccessProfileExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class AccessProfileExporter extends BaseCSVExporter<AccessProfile> {
    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        path: string
    ) {
        super("access profiles",
            tenantId,
            tenantName,
            tenantDisplayName,
            '', // Base exported forces sourceId, but we do not need to use it in here, so leaving it blank.
            path);
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccessProfileExporter.exportFile");
        const headers = [
            "name", "description", "enabled", "source", "owner", "commentsRequired", "denialCommentsRequired", "approvalSchemes", "entitlements"
        ];
        const paths = [
            "name", "descriptionXX", "enabled", "source.name", "owner.name", "accessRequestConfig.denialCommentsRequired", "accessRequestConfig.denialCommentsRequired", "approvalSchemes.approverType", "entitlements"
        ];
        const unwindablePaths: string[] = [];

        const customTransform: any[] | undefined = [
            flatten({ separator: ';', objects: false, arrays: true })
        ];

        const iterator = new AccessProfilePaginator(this.client);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token, customTransform);
    }
}