import * as vscode from 'vscode';
import * as fs from 'fs';
import { TenantService } from "../../services/TenantService";
import { WizardBasedImporterCommand } from './WizardBasedImporterCommand';

/**
 * Entry point to import file from the explorer. Tenant is unknown. File is known.
 * @param node 
 */
export class ImportConfigExplorerCommand extends WizardBasedImporterCommand {
    constructor(
        tenantService: TenantService
    ) { super(tenantService); }

    /**
     * 1. choose the tenant
     * 2. get content of the current selected file in the editor
     * 3. Start the import steps
     */
    async execute(fileUri: vscode.Uri, selectedFiles: vscode.Uri[]): Promise<void> {
        console.log("> ImportConfigExplorerCommand.execute")
        
        const tenantInfo = await this.chooseTenant()
        if (tenantInfo === undefined) {
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
