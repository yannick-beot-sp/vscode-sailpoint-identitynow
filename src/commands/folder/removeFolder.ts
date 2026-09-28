import * as vscode from 'vscode';
import * as commands from '../constants.js';
import { TenantService } from '../../services/TenantService.js';
import { TenantFolderTreeItem } from '../../models/ISCTreeItem.js';
import { confirm } from '../../utils/vsCodeHelpers.js';


export class RemoveFolderCommand {

    constructor(private readonly tenantService: TenantService) { }



    async execute(node: TenantFolderTreeItem): Promise<void> {
        if (!(await confirm(`Are you sure you want to remove ${node.label} and all its content?`))) {
            console.log("< RemoveFolderCommand.execute: Not confirmed");
            return
        }

        await this.tenantService.removeFolderRecursively(node.id)

        await vscode.commands.executeCommand(commands.REFRESH);
    }
}
