import { chooseFile } from '../../utils/vsCodeHelpers';
import { AccessProfilesTreeItem } from '../../models/ISCTreeItem';
import { AccessProfileImporter } from './AccessProfileImporter';

export class AccessProfileImporterTreeViewCommand {

    async execute(node?: AccessProfilesTreeItem): Promise<void> {
        console.log("> AccessProfileImporterTreeViewCommand.execute");
        if (node ===undefined) {
            return;
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const accessProfileImporter = new AccessProfileImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri
        );
        await accessProfileImporter.importFileWithProgression();
    }
}

