import * as vscode from 'vscode';
import * as fs from 'fs';
import { TenantService } from "../../services/TenantService";
import { chooseTenant } from "../../utils/vsCodeHelpers";
import { WizardBasedImporterCommand } from './WizardBasedImporterCommand';

/**
 * Entry point to import file from the explorer. Tenant is unknown. File is known.
 * @param node 
 */
export class ImportConfigExplorerCommand extends WizardBasedImporterCommand {
    constructor(
        private readonly tenantService: TenantService
    ) { super(); }

    /**
     * 1. choose the tenant
     * 2. get content of the current selected file in the editor
     * 3. Start the import steps
     */
    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> ImportConfigExplorerCommand.execute");
        const tenantInfo = await chooseTenant(this.tenantService, 'To which tenant do you want to import the config?');
        console.log("ImportConfigExplorerCommand.execute: tenant = ", tenantInfo);
        if (!tenantInfo) {
            return;
        }
        const data = fs.readFileSync(fileUri.fsPath).toString();
        await this.selectAndImport(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name,
            data
        );
    }
}
