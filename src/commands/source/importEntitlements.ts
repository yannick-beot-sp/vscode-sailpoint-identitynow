import * as vscode from 'vscode';
import { SourceTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from '../../services/ISCClient';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { formatTask, waifForJob } from './sourceUtils';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

class EntitlementImporter {
    readonly client: ISCClient;
    constructor(
        private tenantId: string,
        private tenantName: string,
        private tenantDisplayName: string,
        private sourceName: string,
        private sourceId: string,
        private fileUri: vscode.Uri
    ) {
        this.client = new ISCClient(this.tenantId, this.tenantName);
    }

    async importFileWithProgression(): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Importing entitlements to ${this.sourceName}...`,
            cancellable: false
        }, async (progress, token) =>
            await this.importFile(progress, token)
        );
    }

    protected async importFile(progress: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> EntitlementImporter.importFile");

        const job = await this.client.startEntitlementAggregation(
            this.sourceId,
            this.fileUri.fsPath
        );

        console.log("job =", job);
        const task = await waifForJob(this.client, job.id, token)
        formatTask(task,
            this.sourceName,
            "Import successful to {0}",
            "Warning during import of {0}: {1}",
            "{1}: Import for {0} failed: {2}"
        )
    }
}

/**
 * Entrypoint for the command to import entitlements from the tree view/from a node
 */
export class EntitlementImportNodeCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: SourceTreeItem): Promise<void> {
        console.log("> EntitlementImportNodeCommand.execute");
        
        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import entitlements in ${node.label}`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const entitlementImporter = new EntitlementImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            fileUri
        );
        await entitlementImporter.importFileWithProgression();
    }
}