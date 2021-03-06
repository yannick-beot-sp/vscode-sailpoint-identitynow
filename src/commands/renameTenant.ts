import * as vscode from 'vscode';
import * as commands from './constants';
import { SailPointIdentityNowAuthenticationProvider } from '../services/AuthenticationProvider';
import { TenantService } from '../services/TenantService';
import { isEmpty } from '../utils';
import { TenantTreeItem } from '../models/IdentityNowTreeItem';
import { askDisplayName } from '../utils/vsCodeHelpers';


export class RenameTenantCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: TenantTreeItem): Promise<void> {

        console.log("> RenameTenantCommand.execute", node);
        // assessing that item is a SourceTreeItem
        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: RenameTenantCommand: invalid item", node);
            throw new Error("RenameTenantCommand: invalid item");
        }

        const displayName = await askDisplayName(node.label as string) ?? "";
        if (isEmpty(displayName)) {
            return;
        }
        const tenantInfo = await this.tenantService.getTenant(node.tenantId);
        if (tenantInfo) {
            tenantInfo.name = displayName;
            await this.tenantService.setTenant(tenantInfo);
            vscode.commands.executeCommand(commands.REFRESH);
        }
    }
}
