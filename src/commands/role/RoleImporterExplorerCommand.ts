import * as vscode from 'vscode';
import { TenantService } from '../../services/TenantService';
import { chooseTenant } from '../../utils/vsCodeHelpers';
import { RoleImporter } from './RoleImporter';
import { validateTenantReadonly } from '../validateTenantReadonly';


export class RoleImporterExplorerCommand {
    constructor(private readonly tenantService: TenantService) {  }

    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> AccessProfileImporterExplorerCommand.execute");

        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import the config?');
        console.log("AccessProfileImporterExplorerCommand.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }

        if (!(await validateTenantReadonly(this.tenantService, tenantInfo.id, `import roles`))) {
            return
        }

        const roleImporter = new RoleImporter(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name,
            fileUri
        );
        await roleImporter.importFileWithProgression();
    }
}

