import { askCreateOrUpdate, chooseFile } from '../../utils/vsCodeHelpers.js';
import { RolesTreeItem } from '../../models/ISCTreeItem.js';
import { TenantService } from '../../services/TenantService.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';
import { DimensionImporter } from './DimensionImporter.js';

export class DimensionImporterTreeViewCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: RolesTreeItem): Promise<void> {
        console.log("> DimensionImporterTreeViewCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import dimensions`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const mode = await askCreateOrUpdate("dimension")
        if (mode === undefined) { return; }

        const importer = new DimensionImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri,
            mode
        );
        await importer.importFileWithProgression();
    }
}