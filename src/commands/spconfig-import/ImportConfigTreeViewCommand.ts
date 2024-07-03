import * as fs from 'fs';
import { TenantTreeItem } from "../../models/ISCTreeItem";
import { TenantService } from "../../services/TenantService";
import { WizardBasedImporterCommand } from "./WizardBasedImporterCommand";
import { chooseFile } from '../../utils/vsCodeHelpers';

/**
 * Entry point to import file from the tree view. Tenant is already known
 * @param node 
 */
export class ImportConfigTreeViewCommand extends WizardBasedImporterCommand {
    constructor(
        tenantService: TenantService
    ) { super(tenantService) }

    /**
   * 1. Choose the file
   * 2. get content of the file
   * 3. Start the import steps
   */
    async execute(node?: TenantTreeItem): Promise<void> {
        console.log("> ImportConfigTreeViewCommand.execute");

        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: ImportConfigTreeViewCommand.execute: invalid item", node);
            throw new Error("ImportConfigTreeViewCommand.execute: invalid item");
        }

        if (!(await this.validateTenant(node.tenantId, node.label as string))) {
            return
        }

        const fileUri = await chooseFile('JSON files', 'json');
        if (fileUri === undefined) { return; }
        const data = fs.readFileSync(fileUri.fsPath).toString();
        await this.selectAndImport(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            data
        );
    }
}

