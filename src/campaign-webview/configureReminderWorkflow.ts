import * as vscode from 'vscode';
import { CampaignsTreeItem } from "../models/ISCTreeItem.js";
import { ISCClient } from "../services/ISCClient.js";
import { TenantService } from "../services/TenantService.js";
import { QuickPickPromptStep } from "../wizard/quickPickPromptStep.js";
import { QuickPickTenantStep } from "../wizard/quickPickTenantStep.js";
import { runWizard } from "../wizard/wizard.js";
import { WizardContext } from "../wizard/wizardContext.js";
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { TenantInfo } from '../models/TenantInfo.js';
import { Validator } from '../validator/validator.js';
import { CampaignConfigurationService } from '../services/CampaignConfigurationService.js';

const clientIdValidator = new Validator({
    required: true,
    regexp: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    errorMessages: {
        regexp: "Invalid client ID"
    }
});

const clientSecretValidator = new Validator({
    required: true,
    regexp: "^[a-f0-9]{63,64}$",
    errorMessages: {
        regexp: "Invalid secret"
    }
});

/**
 * Command used to open the campaign panel
 */
export class ConfigureReminderWorkflowCommand {
    constructor(
        private tenantService: TenantService,
        private campaignService: CampaignConfigurationService
    ) {
    }

    async execute(node?: CampaignsTreeItem): Promise<void> {
        console.log("> ConfigureReminderWorkflow.execute", node);
        const context: WizardContext = {}
        if (node !== undefined) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Configure Certification Reminder",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new QuickPickPromptStep({
                    name: "workflow",
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const workflows = await client.getWorflows()

                        return workflows.map((k: any) => ({
                            id: k.id,
                            label: k.name,
                            detail: k.description
                        }))
                    }
                }),
                new InputPromptStep({
                    name: "clientId",
                    options: {
                        placeHolder: '56571217-3cd7-4cca-b780-5223f8449aac',
                        prompt: "Client ID for the external trigger",
                        validateInput: (s: string) => { return clientIdValidator.validate(s); }
                    }
                }),
                new InputPromptStep({
                    name: "clientSecret",
                    options: {
                        password: true,
                        placeHolder: '***',
                        prompt: "Client Secret for the external trigger",
                        validateInput: (s: string) => { return clientSecretValidator.validate(s); }
                    }
                }),
            ]
        }, context);

        if (values === undefined) { return; }
        const tenantName = (values["tenant"] as TenantInfo).tenantName as string
        const clientId = values["clientId"] as string
        const clientSecret = values["clientSecret"] as string

        if (!(await CampaignConfigurationService.validateWorkflowCredentials(clientId, clientSecret, tenantName))) {
            vscode.window.showErrorMessage("Invalid credentials")
            return
        }

        await this.campaignService.setCertificationCampaignInfo(tenantName, {
            tenantName,
            credentials: {
                clientId, clientSecret
            },
            workflowSendingReminderId: values["workflow"].id as string,
            workflowSendingReminderName: values["workflow"].name as string,
        })

        vscode.window.showInformationMessage(`Successfully configured campaign workflow for ${(values["tenant"] as TenantInfo).name}`);
    }
}
