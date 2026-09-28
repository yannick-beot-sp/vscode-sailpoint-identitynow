import * as vscode from 'vscode';
import { Schema } from 'sailpoint-api-client/dist/sources/api.js';
import { SourceTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { TenantService } from '../../services/TenantService.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { runWizard } from '../../wizard/wizard.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep.js';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep.js';
import { createNewUntitledFile } from '../../utils/vsCodeHelpers.js';




export class PeekSourceCommand {

    constructor(private readonly tenantService: TenantService) { }

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: SourceTreeItem) {

        console.log("> PeekSourceCommand.execute", node);
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
                new QuickPickPromptStep({
                    name: "schema",
                    options: {
                        canPickMany: false,
                    },
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const results = (await client!.getSchemas(context["source"].id))
                            .map((x: Schema) => ({
                                id: x.id!,
                                label: x.name!,
                                name: x.name!,
                            }));

                        return results;
                    }
                })
            ]
        }, context);
        
        if (values === undefined) { return; }



        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Peeking  ${values["schema"].name} from ${context["source"].name} in ${context["tenant"].name}...`,
            cancellable: false
        }, async (task, token) => {

            const resources = await client!.peekSourceConnection(
                values["source"].id,
                values["schema"].name,
                10
            )

            await createNewUntitledFile(resources);
        })
    }
}






