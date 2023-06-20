import { TenantTreeItem } from "../../models/IdentityNowTreeItem";
import { WizardBaseExporter } from "./WizardBaseExporter";

/**
 * Entrypoint for full export configuration from the tree view. Tenant is known.
 */
export class ExportConfigTreeView extends WizardBaseExporter {
    constructor() { super(); }

    async execute(node?: TenantTreeItem) {
        console.log("> ExportConfigTreeView.execute");
        // assessing that item is a IdentityNowResourceTreeItem
        if (node === undefined || !(node instanceof TenantTreeItem)) {
            console.log("WARNING: ExportConfigTreeView: invalid item", node);
            throw new Error("ExportConfigTreeView: invalid item");
        }

        await this.chooseAndExport(node.tenantId, node.tenantName,  node.tenantDisplayName);
    }
}
