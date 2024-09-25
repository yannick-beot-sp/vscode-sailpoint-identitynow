import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { AccessProfilesTreeItem, ApplicationTreeItem } from '../../models/ISCTreeItem';
import { ISCClient } from '../../services/ISCClient';
import { runWizard } from '../../wizard/wizard';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { Validator } from '../../validator/validator';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep';
import { requiredValidator } from '../../validator/requiredValidator';
import * as commands from "../constants";
import { buildResourceUri } from '../../utils/UriUtils';
import { openPreview } from '../../utils/vsCodeHelpers';

const appNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%&$!?.*]+$'
});

/**
 * Command used to create an access profile
 */
export class NewApplicationCommand {

    constructor(private readonly tenantService: TenantService) { }

    async execute(node: ApplicationTreeItem): Promise<void> {

        console.log("> NewAccessProfileCommand.newAccessProfile", node);
        const context: WizardContext = {};
        // if the command is called from the Tree View
        if (node) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Creation of an application",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create an application"),
                new InputPromptStep({
                    name: "application",
                    options: {
                        validateInput: (s: string) => { return appNameValidator.validate(s); }
                    }
                }),
                new InputPromptStep({
                    name: "description",
                    options: {
                        placeHolder: "Description",
                        prompt: "Enter the description for this application",
                        validateInput: (s: string) => { return requiredValidator.validate(s); },
                    }
                }),
                new QuickPickSourceStep(() => { return client!; }),
            ]
        }, context);

        if (values === undefined) { return; }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating Application...',
            cancellable: false
        }, async (task, token) => {
            const app = await client.createApplication({
                name: values["application"],
                description: values["description"],
                sourceId: values["source"].id
            })
            vscode.commands.executeCommand(commands.REFRESH_FORCED, node);
            
            const newUri = buildResourceUri({
                tenantName: values["tenant"].tenantName,
                resourceType: "source-apps",
                name: values["application"],
                id: app.id
            })

            openPreview(newUri);
        });
    }
}
