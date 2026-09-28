import { askCreateOrUpdate, chooseFile } from '../../utils/vsCodeHelpers.js';
import { AccessProfilesTreeItem } from '../../models/ISCTreeItem.js';
import { AccessProfileImporter } from './AccessProfileImporter.js';
import { validateTenantReadonly } from '../validateTenantReadonly.js';
import { TenantService } from '../../services/TenantService.js';

export class AccessProfileImporterTreeViewCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: AccessProfilesTreeItem): Promise<void> {
        console.log("> AccessProfileImporterTreeViewCommand.execute");
        
        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import access profiles`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }
        
        const mode = await askCreateOrUpdate("access profile") 
        if (mode === undefined) { return; }

        const accessProfileImporter = new AccessProfileImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri,
            mode
        );
        await accessProfileImporter.importFileWithProgression();
    }
}

