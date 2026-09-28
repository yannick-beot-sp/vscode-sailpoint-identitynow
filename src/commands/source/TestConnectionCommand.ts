import * as vscode from 'vscode';

import { StatusResponse, StatusResponseStatusEnum as StatusResponseStatus } from 'sailpoint-api-client/dist/sources/api.js';
import { SourceTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { TenantService } from '../../services/TenantService.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { runWizard } from '../../wizard/wizard.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep.js';

export class TestConnectionCommand {

    constructor(private readonly tenantService: TenantService) { }
    
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {

        console.log("> TestConnectionCommand.execute");
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof SourceTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
            context["source"] = {
                id: node.id!,
                name: node.label!
            }
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Peek resources",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new QuickPickSourceStep(() => { return client!; }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Testing  ${values["source"].name} from ${values["tenant"].name}...`,
            cancellable: false
        }, async (task, token) => { return await client.testSourceConnection(values["source"].id) })
            .then(async (result: StatusResponse) => {
                if (StatusResponseStatus.Success === result.status) {
                    vscode.window.showInformationMessage(
                        `Connection test successfull for ${values["source"].name} from ${values["tenant"].name}`
                    );
                } else {
                    const errorMessage = (result.details as any)?.error
                    vscode.window.showErrorMessage(
                        `Connection test failed for ${values["source"].name} from ${values["tenant"].name}: ${errorMessage}`
                    );
                }
            });
    }
}






