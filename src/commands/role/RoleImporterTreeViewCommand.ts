import { RoleImporter } from './RoleImporter';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';

export class RoleImporterTreeViewCommand {

    async execute(node?: RolesTreeItem): Promise<void> {
        console.log("> RoleImporterTreeViewCommand.execute");
        if (node ===undefined) {
            return;
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri
        );
        await roleImporter.importFileWithProgression();
    }
}