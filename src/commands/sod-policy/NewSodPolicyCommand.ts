import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService.js";
import { BaseTreeItem, GeneralPoliciesTreeItem, SodPoliciesTreeItem } from '../../models/ISCTreeItem.js';
import { NEW_ID } from '../../constants.js';
import { ISCClient } from '../../services/ISCClient.js';
import { getResourceUri } from '../../utils/UriUtils.js';
import { SodPolicy } from 'sailpoint-api-client/dist/sod_policies/api.js';
import { runWizard } from '../../wizard/wizard.js';
import { InputPromptStep } from '../../wizard/inputPromptStep.js';
import { Validator } from '../../validator/validator.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { InputIdentityQueryStep } from '../../wizard/inputIdentityQueryStep.js';
import { QuickPickIdentityStep } from '../../wizard/quickPickIdentityStep.js';
import { createNewFile } from '../../utils/vsCodeHelpers.js';
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sodPolicyTemplates: Record<string, { label: string, description: string, template: SodPolicy }> = require('../../../snippets/sod-policy.json');

const sodPolicyNameValidator = new Validator({
    required: true,
});

export type SodPolicyType = "CONFLICTING_ACCESS_BASED" | "GENERAL";

const COMMAND_SETTINGS: Record<SodPolicyType, { title: string, action: string, ownerLabel: string, folder: new (...args: any[]) => BaseTreeItem }> = {
    CONFLICTING_ACCESS_BASED: {
        title: "Creation of a SoD policy",
        action: "create a SoD policy",
        ownerLabel: "SoD policy owner",
        folder: SodPoliciesTreeItem,
    },
    GENERAL: {
        title: "Creation of a general policy",
        action: "create a general policy",
        ownerLabel: "general policy owner",
        folder: GeneralPoliciesTreeItem,
    },
};

/**
 * Command used to create a SoD policy of a given type.
 * Opens a new unsaved document based on a template. Saving it creates the policy.
 */
export class NewSodPolicyCommand {

    constructor(
        private readonly tenantService: TenantService,
        private readonly policyType: SodPolicyType
    ) { }

    async newPolicy(folderTreeItem?: BaseTreeItem): Promise<void> {

        console.log("> NewSodPolicyCommand.newPolicy", this.policyType, folderTreeItem);
        const settings = COMMAND_SETTINGS[this.policyType];
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (folderTreeItem !== undefined && folderTreeItem instanceof settings.folder) {
            context["tenant"] = this.tenantService.getTenant(folderTreeItem.tenantId);
        }

        let client: ISCClient | undefined = undefined;
        const values = await runWizard({
            title: settings.title,
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    settings.action),
                new InputPromptStep({
                    name: "policy",
                    displayName: "policy name",
                    options: {
                        validateInput: (s: string) => { return sodPolicyNameValidator.validate(s); }
                    }
                }),
                new InputIdentityQueryStep(),
                new QuickPickIdentityStep(
                    settings.ownerLabel,
                    () => { return client!; }
                ),
            ]
        }, context);

        if (values === undefined) { return; }

        // Deep copy of the template
        const newPolicy: SodPolicy = JSON.parse(JSON.stringify(sodPolicyTemplates[this.policyType].template));

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            const name = values["policy"].trim();
            const tenantName = values["tenant"].tenantName;
            const newUri = getResourceUri(tenantName, 'sod-policies', NEW_ID, name);

            newPolicy.name = name;
            newPolicy.ownerRef = {
                id: values["owner"].id,
                name: values["owner"].name,
                type: "IDENTITY"
            };

            await createNewFile(newUri, newPolicy);
        });
    }
}
