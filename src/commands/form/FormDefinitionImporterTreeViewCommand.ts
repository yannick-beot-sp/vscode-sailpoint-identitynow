import { chooseFile } from '../../utils/vsCodeHelpers.js';
import { FormsTreeItem } from '../../models/ISCTreeItem.js';
import { FormDefinitionImporter } from './FormDefinitionImporter.js';
import { TenantService } from '../../services/TenantService.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';

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
        await formImporter.chooseAndImport();
    }
}

