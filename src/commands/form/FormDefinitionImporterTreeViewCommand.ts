import { chooseFile } from '../../utils/vsCodeHelpers';
import { FormsTreeItem } from '../../models/ISCTreeItem';
import { FormDefinitionImporter } from './FormDefinitionImporter';

export class FormDefinitionImporterTreeViewCommand {

    async execute(node: FormsTreeItem): Promise<void> {
        console.log("> FormDefinitionImporterTreeViewCommand.execute");

        const fileUri = await chooseFile('JSON', 'json');
        if (fileUri === undefined) { return; }

        const formImporter = new FormDefinitionImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri
        )
        await formImporter.importFileWithProgression();
    }
}

