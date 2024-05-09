import * as vscode from 'vscode';
import * as commands from './constants';
import { ISCResourceTreeItem } from '../models/ISCTreeItem';
import { ISCClient } from '../services/ISCClient';
import { getPathByUri } from '../utils/UriUtils';
import { TenantService } from '../services/TenantService';
import { isTenantReadonly, validateTenantReadonly } from './validateTenantReadonly';
import { confirm } from '../utils/vsCodeHelpers';


export class DeleteResourceCommand {
    constructor(private readonly tenantService: TenantService) { }


    async execute(node: ISCResourceTreeItem): Promise<void> {

        console.log("> deleteResource", node);
        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)
        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `delete ${node.contextValue} ${node.label}`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to delete ${node.contextValue} ${node.label}?`)))) {
            console.log("< deleteResource: no delete");
            return
        }

        const client = new ISCClient(node.tenantId, node.tenantName);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Deleting ${node.contextValue}...`,
            cancellable: false
        }, async () => await client.deleteResource(getPathByUri(node.uri) || ""))
            .then(() => {
                vscode.window.showInformationMessage(`Successfully deleted ${node.contextValue} ${node.label}`);
                vscode.commands.executeCommand(commands.REFRESH_FORCED);
            });

    }
}