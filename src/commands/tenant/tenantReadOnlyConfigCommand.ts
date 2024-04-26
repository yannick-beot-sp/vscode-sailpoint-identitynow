import { TenantTreeItem } from "../../models/ISCTreeItem";
import * as vscode from 'vscode';
import * as commands from '../constants';
import { TenantService } from "../../services/TenantService";

export class TenantReadOnlyConfigCommand {

    constructor(private readonly tenantService: TenantService) {

    }

    public async setReadOnly(node: TenantTreeItem): Promise<void> {
        console.log("> TenantReadOnlyConfigCommand.setReadOnly", node);
        await this.updateReadonly(node, true)
    }

    public async setWritable(node: TenantTreeItem): Promise<void> {
        console.log("> TenantReadOnlyConfigCommand.setWritable", node);
        await this.updateReadonly(node, false)
    }

    private async updateReadonly(node: TenantTreeItem, readOnly: boolean): Promise<void> {
        const tenantInfo = this.tenantService.getTenant(node.tenantId)
        tenantInfo.readOnly = readOnly
        this.tenantService.setTenant(tenantInfo)

        // force refresh to update icon
        await vscode.commands.executeCommand(commands.REFRESH_FORCED);

        const uris = vscode.window.tabGroups?.all?.
            flatMap(tabGroup => tabGroup.tabs)?.
            map(tab => tab.input).
            map(input => typeof input === 'object' && input !== null && 'uri' in input ? input.uri : undefined)
            .filter(Boolean)
            .filter((uri: vscode.Uri) => uri.authority === tenantInfo.tenantName)
        console.log(uris);

        if (uris && uris.length > 0) {
            await vscode.commands.executeCommand(commands.MODIFIED_RESOURCE, uris);
        }

    }
}