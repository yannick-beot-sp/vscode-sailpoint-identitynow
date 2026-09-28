import * as vscode from 'vscode';
import { TenantTreeItem } from "../models/ISCTreeItem.js";
import { ISCClient } from '../services/ISCClient.js';
import { TenantService } from '../services/TenantService.js';

import { WizardContext } from '../wizard/wizardContext.js';
import { QuickPickPromptStep } from '../wizard/quickPickPromptStep.js';
import { runWizard } from '../wizard/wizard.js';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep.js';
import { IWizardOptions } from '../wizard/wizardOptions.js';
import { WizardPromptStep } from '../wizard/wizardPromptStep.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { emailValidator } from '../validator/emailValidator.js';

type EmailSettingChoice = vscode.QuickPickItem & { emailTestMode: boolean }


class QuickPickEmailSettingsStep extends QuickPickPromptStep<WizardContext, EmailSettingChoice> {
    constructor(
        private readonly choice1Steps: WizardPromptStep<WizardContext>[],
        private readonly choice2Steps: WizardPromptStep<WizardContext>[]
    ) {
        super({
            name: "emailTestMode",
            shouldPrompt: true,
            options: {
                canPickMany: false,
                placeHolder: "Send All Emails To"
            },
            items: async (context: WizardContext): Promise<EmailSettingChoice[]> => {
                const choices = [
                    { label: "Intended Recipients", picked: false, emailTestMode: false },
                    { label: "Test Address", picked: false, emailTestMode: true }
                ]
                context["emailTestMode"] = choices.filter(item=>item.emailTestMode === context["emailTestMode"])

                return choices
            },
            project: (x: EmailSettingChoice) => x.emailTestMode
        });
    }

    public async getSubWizard(wizardContext: WizardContext): Promise<IWizardOptions<WizardContext> | undefined> {
        return {
            promptSteps: wizardContext["emailTestMode"] ? this.choice2Steps : this.choice1Steps
        }
    }
}


/**
 * Command used to open a source or a transform
 */
export class EmailSettingsCommand {

    constructor(private readonly tenantService: TenantService) { }
    async execute(node: TenantTreeItem): Promise<void> {
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof TenantTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }

        let client: ISCClient | undefined = undefined;
        const values = await runWizard({
            title: "Email Settings",
            hideStepCount: true,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                        const conf = await client.getEmailTestMode()
                        wizardContext["emailTestAddress"] = conf.emailTestAddress
                        wizardContext["emailTestMode"] = conf.emailTestMode
                    },
                    "configure email settings"),
                new QuickPickEmailSettingsStep(
                    undefined,
                    [ // "Test Address" 
                        new InputPromptStep({
                            name: "emailTestAddress",
                            displayName: "Test Address",
                            options: {
                                placeHolder: "myemail@example.com",
                                validateInput: (s: string) => { return emailValidator.validate(s); },
                                shouldPrompt: () => true
                            }
                        }),
                    ],

                )
            ]
        }, context);

        if (values === undefined) { return; }
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Saving email settings for ${values["tenant"].name}...`,
            cancellable: false
        }, async () => await client.updateEmailTestMode(values["emailTestMode"], values["emailTestAddress"])
        ).then(
            () => vscode.window.showInformationMessage(`Email settings for ${values["tenant"].name} saved!`),
            (reason) => {
                console.error(reason);
                vscode.window.showInformationMessage(`Could not save email settings for ${values["tenant"].name}.`)
            })
    }
}
