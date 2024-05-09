import * as vscode from 'vscode';
import { SourceTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from '../../services/ISCClient';
import { CSVReader } from '../../services/CSVReader';
import { UncorrelatedAccount } from '../../models/UncorrelatedAccount';
import { chooseFile } from '../../utils/vsCodeHelpers';
import { isEmpty } from '../../utils/stringUtils';
import { TenantService } from '../../services/TenantService';
import { validateTenantReadonly } from '../validateTenantReadonly';

interface UncorrelatedAccountImportResult {
    correlated: number
    error: number
    emptyAccount: number
    emptyUsername: number
    identityNotFound: number
    accountNotFound: number
}


class UncorrelatedAccountImporter {
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
            title: `Importing uncorrelated accounts to ${this.sourceName}...`,
            cancellable: true
        }, async (task, token) => await this.importFile(task, token))
            .then(() => { return; },
                error => vscode.window.showErrorMessage(error.toString())
            );
    }

    protected async importFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> UncorrelatedAccountImporter.importFile");
        const csvReader = new CSVReader(this.fileUri.fsPath);

        const nbLines = await csvReader.getLines();
        const incr = 100 / nbLines;
        task.report({ increment: 0 });

        const result: UncorrelatedAccountImportResult = {
            correlated: 0,
            error: 0,
            emptyUsername: 0,
            emptyAccount: 0,
            identityNotFound: 0,
            accountNotFound: 0
        };
        await csvReader.processLine(async (data: UncorrelatedAccount) => {
            if (token.isCancellationRequested) {
                // skip
                return;
            }
            task.report({ increment: incr, message: data.account });
            if (isEmpty(data.account)) {
                result.emptyAccount++;
                return;
            }
            // If no username, skip
            if (isEmpty(data.userName)) {
                result.emptyUsername++;
                return;
            }

            let account = undefined;
            try {
                // Getting account
                account = await this.client.getAccountBySource(this.sourceId, data.account);
            } catch (error) {
                console.error(error);
            }
            // If no account, skip
            if (account === undefined) {
                result.accountNotFound++;
                return;
            }

            let identity = undefined;
            try {
                // Getting identity
                identity = await this.client.getPublicIdentityByAlias(data.userName);
            } catch (error) {
                console.error(error);
            }
            // If no identity, skip
            if (identity === undefined) {
                result.identityNotFound++;
                return;
            }

            if (identity.id === account.identityId) {
                result.correlated++;
                return;
            }

            try {
                await this.client.updateAccount(account.id, identity.id);
                result.correlated++;
            } catch (error) {
                result.error++;
                console.error(error);
            }

        });

        const message = `${nbLines} line(s) processed. ${result.correlated} sucessfully correlated. ${result.emptyUsername} with empty userName. ${result.error} error(s). ${result.identityNotFound} identities not found. ${result.accountNotFound} account(s) not found.`;

        if (result.error > 0) {
            vscode.window.showErrorMessage(message);
        } else if (result.emptyUsername > 0 || result.identityNotFound > 0 || result.accountNotFound > 0) {
            vscode.window.showWarningMessage(message);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }
}

/**
 * Entrypoint for the command to import accounts from the tree view/from a node
 */
export class UncorrelatedAccountImportNodeCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node?: SourceTreeItem): Promise<void> {
        console.log("> UncorrelatedAccountImportNodeCommand.execute");

        if (!(await validateTenantReadonly(this.tenantService, node.tenantId, `import uncorrelated accounts in ${node.label}`))) {
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) { return; }

        const accountImporter = new UncorrelatedAccountImporter(
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