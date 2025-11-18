import { askCreateOrUpdate, chooseFile } from '../../utils/vsCodeHelpers';
import { AccessProfilesTreeItem } from '../../models/ISCTreeItem';
import { AccessProfileImporter } from './AccessProfileImporter';
import { validateTenantReadonly } from '../validateTenantReadonly';
import { TenantService } from '../../services/TenantService';

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

