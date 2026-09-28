import * as vscode from 'vscode';
import * as commands from '../constants.js';
import { TenantService } from '../../services/TenantService.js';
import { BaseTreeItem } from '../../models/ISCTreeItem.js';
import { isBlank } from '../../utils/stringUtils.js';


export class RenameFolderCommand {

    constructor(private readonly tenantService: TenantService) { }



    async execute(element: BaseTreeItem): Promise<void> {
        const folderName = await vscode.window.showInputBox({
            title: "Rename folder",
            placeHolder: "folder name",
            value: element.label as string
        });
        if (isBlank(folderName)) {
            return
        }

        const node = this.tenantService.getNode(element.id)
        node.name = folderName

        this.tenantService.updateOrCreateNode(node)

        // Should have refresh the parent, but not an easy info to get
        await vscode.commands.executeCommand(commands.REFRESH);
    }
}
