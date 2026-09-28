import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService.js";
import { AccessProfilesTreeItem, ApplicationTreeItem } from '../../models/ISCTreeItem.js';
import { ISCClient } from '../../services/ISCClient.js';
import { runWizard } from '../../wizard/wizard.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { InputPromptStep } from '../../wizard/inputPromptStep.js';
import { Validator } from '../../validator/validator.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep.js';
import { requiredValidator } from '../../validator/requiredValidator.js';
import * as commands from "../constants.js";
import { buildResourceUri } from '../../utils/UriUtils.js';
import { openPreview } from '../../utils/vsCodeHelpers.js';

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
