import { IdentitySearch } from './IdentitySearchCommand';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { IdentityTreeItem } from '../../models/IdentityNowTreeItem';

export class IdentityDefinitionImporterTreeViewCommand {

    async execute(node?: IdentityTreeItem): Promise<void> {
        console.log("> IdentityDefinitionImporterTreeViewCommand.execute");
        if (node ===undefined) {
            return;
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }
/*
        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri
        );
        await roleImporter.importFileWithProgression();
        */
    }
}