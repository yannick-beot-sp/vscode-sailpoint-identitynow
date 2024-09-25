import * as vscode from "vscode";
import { ApplicationAccessProfileTreeItem } from "../../models/ISCTreeItem";
import * as commands from "../constants";
import { ISCClient } from "../../services/ISCClient";
import { TenantService } from "../../services/TenantService";
import { isTenantReadonly, validateTenantReadonly } from "../validateTenantReadonly";
import { confirm } from "../../utils/vsCodeHelpers";

/**
 * Search apps by name
 */
export class RemoveAccessProfileFromAppCommand {

    constructor(private readonly tenantService: TenantService) { }


    public async execute(node: ApplicationAccessProfileTreeItem): Promise<void> {
        console.log("> RemoveAccessProfileFromAppCommand.execute", node);

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)

        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `remove ${node.label}`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to remove ${node.label}?`)))) {
            console.log("< RemoveAccessProfileFromAppCommand.execute: no remove");
            return
        }

        const client = new ISCClient(node.tenantId, node.tenantName);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Removing Access Profile from Application...',
            cancellable: false
        }, async () => {
            await client.removeAccessProfileFromApplication(node.appId, node.resourceId)
            vscode.commands.executeCommand(commands.REFRESH_FORCED, node.parentNode);
        });
    }
}