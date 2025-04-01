import * as vscode from 'vscode';
import * as commands from '../constants';
import { TenantService } from '../../services/TenantService';
import { BaseTreeItem } from '../../models/ISCTreeItem';
import { randomUUID } from 'crypto';


export class AddFolderCommand {

    constructor(private readonly tenantService: TenantService) { }



    async execute(element?: BaseTreeItem): Promise<void> {
        const folderName = await vscode.window.showInputBox({ title: "New folder", placeHolder: "folder name" });
        if (!folderName) {
            return;
        }

        const id = randomUUID().replaceAll('-', '');

        this.tenantService.createOrUpdateInFolder({
            id,
            name: folderName,
            type: "FOLDER"
        }, element?.id)

        await vscode.commands.executeCommand(commands.REFRESH, element);
    }
}
