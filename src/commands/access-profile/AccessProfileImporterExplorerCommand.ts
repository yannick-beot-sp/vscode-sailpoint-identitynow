import * as vscode from 'vscode';
import { AccessProfileImporter } from './AccessProfileImporter';
import { TenantService } from '../../services/TenantService';
import { chooseTenant } from '../../utils/vsCodeHelpers';


export class AccessProfileImporterExplorerCommand {
    constructor(
        private readonly tenantService: TenantService
    ) {  }

    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> AccessProfileImporterExplorerCommand.execute");

        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import access profiles?');
        console.log("AccessProfileImporterExplorerCommand.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }

        const accessProfileImporter = new AccessProfileImporter(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name,
            fileUri
        );

        await accessProfileImporter.importFileWithProgression();
    }
}

