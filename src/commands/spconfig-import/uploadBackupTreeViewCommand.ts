import * as vscode from 'vscode';
import * as fs from 'fs';
import { TenantTreeItem } from "../../models/ISCTreeItem";
import { TenantService } from "../../services/TenantService";
import { ISCClient } from '../../services/ISCClient';
import { basename } from 'path';
import { waitForUploadJob } from './utils';
import { WizardContext } from '../../wizard/wizardContext';
import { runWizard } from '../../wizard/wizard';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { ChooseFileStep } from '../../wizard/chooseFileStep';
import { BackupResponseV2024StatusV2024 } from 'sailpoint-api-client';

/**
 * Entry point to import file from the tree view. Tenant is already known
 * @param node 
 */
export class UploadBackupTreeViewCommand {
    constructor(
        readonly tenantService: TenantService
    ) { }

    /**
   * 1. Choose the file
   * 2. get content of the file
   * 3. Start the import steps
   */
    async execute(node?: TenantTreeItem): Promise<void> {
        console.log("> UploadBackupTreeViewCommand.execute");

        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TenantTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }

        const UPLOAD_NAME_KEY = "uploadName",
            FILE_URI_KEY = "fileUri",
            DATA_KEY = "data"

        const values = await runWizard({
            title: "Upload a configuration",
            hideStepCount: true,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => { },
                    "upload a configuration"),
                new ChooseFileStep({
                    name: FILE_URI_KEY,
                    afterPrompt: async (ctx) => {
                        const uri = ctx[FILE_URI_KEY]
                        const data = fs.readFileSync(uri.fsPath).toString();
                        const spConfig = JSON.parse(data);
                        ctx[UPLOAD_NAME_KEY] = spConfig.description
                        ctx[DATA_KEY] = data
                    },
                    options: {
                        canSelectMany: false
                    }
                }),
                new InputPromptStep({
                    name: UPLOAD_NAME_KEY,
                    displayName: "configuration",
                    options: {
                        placeHolder: "Name that will be assigned to the uploaded configuration file.",
                        shouldPrompt: () => true // always prompt
                    },
                })

            ]
        }, context);

        if (values === undefined) { return; }


        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Uploading configuration ${node.tenantDisplayName}...`,
            cancellable: false
        }, async (task, token) => {
            const fileUri = values[FILE_URI_KEY]
            const data = values[DATA_KEY]
            const filename = basename(fileUri.fsPath)


            const client = new ISCClient(node.tenantId, node.tenantName);
            const job = await client.uploadBackup(data, filename, values[UPLOAD_NAME_KEY]);
            const jobStatus = await waitForUploadJob(client, job.jobId, token)
            return jobStatus;
        }).then((jobStatus) => {
            if (jobStatus.status == BackupResponseV2024StatusV2024.Complete) {
                vscode.window.showInformationMessage(`Configuration uploaded successfully to ${node.tenantDisplayName}`)
            } else {
                vscode.window.showErrorMessage(`Could not upload configuration to ${node.tenantDisplayName}: ${jobStatus.message}`)
            }

        })

    }
}

