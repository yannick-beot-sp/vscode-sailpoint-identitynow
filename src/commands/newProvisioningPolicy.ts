import * as vscode from 'vscode';
import * as commands from './constants.js';
import { ProvisioningPoliciesTreeItem } from "../models/ISCTreeItem.js";
import { compareByLabel } from '../utils.js';
import { getIdByUri, getProvisioningPolicyUri } from '../utils/UriUtils.js';
import { Usagetypev2 as UsageTypeV2 } from 'sailpoint-api-client/dist/sources/api.js';
import { convertConstantToTitleCase, isEmpty } from '../utils/stringUtils.js';
import { ExtendedQuickPickItem } from '../models/ExtendedQuickPickItem.js';
import { openPreview } from '../utils/vsCodeHelpers.js';
import { TenantService } from '../services/TenantService.js';
import { WizardContext } from '../wizard/wizardContext.js';
import { runWizard } from '../wizard/wizard.js';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep.js';
import { Validator } from '../validator/validator.js';
import { InputPromptStep } from '../wizard/inputPromptStep.js';
import { QuickPickPromptStep } from '../wizard/quickPickPromptStep.js';
import { ISCClient } from '../services/ISCClient.js';



const provisioningPolicyNameValidator = new Validator({
    required: false,
    maxLength: 50,
    regexp: '^$|^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$'
});


function prepareUsageTypePickItems(): Array<ExtendedQuickPickItem> {
    const FIRST = UsageTypeV2.Create;
    return Object.values(UsageTypeV2).map(key => ({
        label: convertConstantToTitleCase(key),
        description: (key === FIRST ? "(default)" : ""),
        value: key
    }))
        .sort(compareByLabel)
        // To move "Create" at the top. cf. https://stackoverflow.com/a/23921775
        .sort((a, b) => a.value === FIRST ? -1 : b.value === FIRST ? 1 : 0);
}

/**
 * Command used to create a new provisionnig policy
 */
export class NewProvisioningPolicyCommand {

    constructor(private readonly tenantService: TenantService) { }

    public async execute(node: ProvisioningPoliciesTreeItem): Promise<void> {
        console.log("> newProvisioningPolicy", node);

        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (node !== undefined && node instanceof ProvisioningPoliciesTreeItem) {
            context["tenant"] = this.tenantService.getTenant(node.tenantId);
        }
        let client: ISCClient | undefined = undefined;
        const values = await runWizard({
            title: "Creation of a provisioning policy",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create a provisioning policy"),
                new QuickPickPromptStep({
                    name: "provisioningPolicyType",
                    items: prepareUsageTypePickItems
                }),
                new InputPromptStep({
                    name: "provisioningPolicy",
                    options: {
                        validateInput: (s: string) => { return provisioningPolicyNameValidator.validate(s); }
                    }
                }),

            ]
        }, context);

        if (values === undefined) { return; }

        const usageType = values["provisioningPolicyType"]
        const provisioningPolicyName = values["provisioningPolicy"] ?? ""
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {

            const data = {
                "name": isEmpty(provisioningPolicyName) ? usageType.value : provisioningPolicyName,
                "description": null,
                "usageType": usageType.value,
                "fields": []
            };

            const sourceId = getIdByUri(node.parentUri)
            const createdPolicy = await client.createProvisioningPolicy(sourceId, data)
            const newUri = getProvisioningPolicyUri(
                values["tenant"].tenantName,
                sourceId,
                createdPolicy.id,
                createdPolicy.name
            )
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
            openPreview(newUri)
        });
    }
}
