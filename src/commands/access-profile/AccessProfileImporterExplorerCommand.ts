import * as vscode from 'vscode';
import { AccessProfileImporter } from './AccessProfileImporter';
import { TenantService } from '../../services/TenantService';
import { askCreateOrUpdate, chooseTenant } from '../../utils/vsCodeHelpers';
import { validateTenantReadonly } from '../validateTenantReadonly';


export class AccessProfileImporterExplorerCommand {
    constructor(
        private readonly tenantService: TenantService
    ) { }

    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> AccessProfileImporterExplorerCommand.execute");

        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import access profiles?');
        console.log("AccessProfileImporterExplorerCommand.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }

        if (!(await validateTenantReadonly(this.tenantService, tenantInfo.id, `import access profiles`))) {
            return
        }

        const mode = await askCreateOrUpdate("access profile")
        if (mode === undefined) { return; }

        const accessProfileImporter = new AccessProfileImporter(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name,
            fileUri,
            mode
        );

        await accessProfileImporter.importFileWithProgression();
    }
}

