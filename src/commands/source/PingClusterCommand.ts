import * as vscode from 'vscode';

import { StatusResponseBeta, StatusResponseBetaStatusEnum } from 'sailpoint-api-client';
import { SourceTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { TenantService } from '../../services/TenantService';
import { WizardContext } from '../../wizard/wizardContext';
import { runWizard } from '../../wizard/wizard';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep';

export class PingClusterCommand {

    constructor(private readonly tenantService: TenantService) { }
    
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {

        console.log("> PingClusterCommand.execute");
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof SourceTreeItem) {
            context["tenant"] = await this.tenantService.getTenant(node.tenantId);
            context["source"] = {
                id: node.id!,
                name: node.label!
            }
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Ping resources",
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
        console.log({ values });
        if (values === undefined) { return; }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Ping connection  ${values["source"].name} from ${values["tenant"].name}...`,
            cancellable: false
        }, async (task, token) => { return await client.pingCluster(values["source"].id) })
            .then(async (result: StatusResponseBeta) => {
                if (StatusResponseBetaStatusEnum.Success === result.status) {
                    vscode.window.showInformationMessage(
                        `Ping test successfull for ${values["source"].name} from ${values["tenant"].name}`
                    );
                } else {
                    const errorMessage = (result.details as any)?.error
                    vscode.window.showErrorMessage(
                        `Ping test failed for ${values["source"].name} from ${values["tenant"].name}: ${errorMessage}`
                    );
                }
            });
    }
}






