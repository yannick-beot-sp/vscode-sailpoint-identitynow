import { RoleImporter } from './RoleImporter';
import { askCreateOrUpdate, chooseFile } from '../../utils/vsCodeHelpers';
import { RolesTreeItem } from '../../models/ISCTreeItem';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

export class RoleImporterTreeViewCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: RolesTreeItem): Promise<void> {
        console.log("> RoleImporterTreeViewCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import roles`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const mode = await askCreateOrUpdate("role")
        if (mode === undefined) { return; }

        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri,
            mode
        );
        await roleImporter.importFileWithProgression();
    }
}