import { chooseFile } from '../../utils/vsCodeHelpers';
import { FormsTreeItem } from '../../models/ISCTreeItem';
import { FormDefinitionImporter } from './FormDefinitionImporter';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

export class FormDefinitionImporterTreeViewCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: FormsTreeItem): Promise<void> {
        console.log("> FormDefinitionImporterTreeViewCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import forms`))) {
            return
        }
        
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

