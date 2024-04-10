import { TenantTreeItem } from "../../models/ISCTreeItem";
import { WizardBasedExporterCommand } from "./WizardBasedExporterCommand";

/**
 * Entrypoint for full export configuration from the tree view. Tenant is known.
 */
export class ExportConfigTreeViewCommand extends WizardBasedExporterCommand {
    constructor() { super(); }

    async execute(node?: TenantTreeItem) {
        console.log("> ExportConfigTreeView.execute");
        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: ExportConfigTreeView: invalid item", node);
            throw new Error("ExportConfigTreeView: invalid item");
        }

        await this.chooseAndExport(node.tenantId, node.tenantName,  node.tenantDisplayName);
    }
}
