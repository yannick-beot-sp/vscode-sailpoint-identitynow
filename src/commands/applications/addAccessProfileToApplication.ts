
import * as vscode from 'vscode';
import * as commands from "../constants";
import { TenantService } from "../../services/TenantService";
import { ApplicationTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { runWizard } from '../../wizard/wizard';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickAccessProfileStep } from '../../wizard/quickPickAccessProfileStep';
import { isTenantReadonly, validateTenantReadonly } from '../validateTenantReadonly';


export class AddAccessProfileToApplication {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: ApplicationTreeItem): Promise<void> {

        console.log("> AddAccessProfileToApplication.execute", node);
        const client = new ISCClient(node.tenantId, node.tenantName);
        const context: WizardContext = {};

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)

        if (isReadOnly
            && !(await validateTenantReadonly(this.tenantService, node.tenantId, `add an access profile to ${node.label}`))) {
            console.log("< AddAccessProfileToApplication.execute: no add");
            return
        }

        const values = await runWizard({
            title: "Add Access Profile To Application",
            hideStepCount: false,
            promptSteps: [
                new InputPromptStep({
                    name: "accessProfileQuery",
                    options: {
                        prompt: "Enter a query to find access profiles or leave empty",
                        placeHolder: "Enter search query",
                        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-access-profile-data",
                        afterPrompt: async (wizardContext: WizardContext) => {
                            wizardContext["accessProfileQueryAfter"] = `source.id:${node.sourceId} AND ` + wizardContext["accessProfileQuery"]
                        }
                    }
                }),
                new QuickPickAccessProfileStep({
                    getISCClient: () => { return client; },
                    canPickMany: true,
                    accessProfileQueryKey: "accessProfileQueryAfter"
                })
            ]
        }, context);

        if (values === undefined) { return; }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Adding Access Profile(s) To Application...',
            cancellable: false
        }, async () => {
            const accessProfiles = values["accessProfiles"]
            const accessProfileIds = accessProfiles.map(x => x.id)
            await client.addAccessProfilesToApplication(node.id, accessProfileIds)

            await vscode.commands.executeCommand(commands.REFRESH_FORCED, node);

        });
    }
}
