import * as vscode from 'vscode';
import { SourceTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from '../../services/ISCClient';
import { delay } from '../../utils';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { formatTask, waifForJob } from './sourceUtils';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

class AccountImporter {
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
            title: `Importing accounts to ${this.sourceName}...`,
            cancellable: false
        }, async (progress, token) =>
            await this.importFile(progress, token)
        );
    }

    protected async importFile(progress: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccountImporter.importFile");

        const job = await this.client.startAccountAggregation(
            this.sourceId,
            false,
            this.fileUri.fsPath
        );

        console.log("job =", job);
        const task = await waifForJob(this.client, job.task.id, token)
        formatTask(task,
            this.sourceName,
            "Import successful to {0}",
            "Warning during import of {0}: {1}",
            "{1}: Import for {0} failed: {2}"
        )
    }
}

/**
 * Entrypoint for the command to import accounts from the tree view/from a node
 */
export class AccountImportNodeCommand {
    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: SourceTreeItem): Promise<void> {
        console.log("> AccountImportNodeCommand.execute");
        
        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import accounts in ${node.label}`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const accountImporter = new AccountImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            node.label as string,
            node.id as string,
            fileUri
        );
        await accountImporter.importFileWithProgression();
    }
}