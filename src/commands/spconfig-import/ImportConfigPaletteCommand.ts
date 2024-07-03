import * as vscode from 'vscode';
import { TenantService } from '../../services/TenantService';
import { getFullContent } from '../../utils/vsCodeHelpers';
import { WizardBasedImporterCommand } from './WizardBasedImporterCommand';

/**
 * Entry point to import file from the command palette. Tenant is unknown. File is known.
 * @param node 
 */
export class ImportConfigPaletteCommand extends WizardBasedImporterCommand {
    constructor(
        tenantService: TenantService
    ) { super(tenantService) }

    /**
     * 1. choose the tenant
     * 2. get content of the current selected file in the editor
     * 3. Start the import steps
     */
    async execute(): Promise<void> {
        console.log("> ImportConfigPaletteCommand.execute");
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.error('No editor');
            throw new Error("No editor");
        }
        
        const tenantInfo = await this.chooseTenant()
        if (tenantInfo === undefined) {
            return;
        }

        const data = getFullContent(editor);
        await this.selectAndImport(
            tenantInfo.id,
            tenantInfo.tenantName,
            tenantInfo.name,
            data
        );
    }
}


