import * as vscode from 'vscode';
import * as commands from './constants';
import { ProvisioningPoliciesTreeItem } from "../models/ISCTreeItem";
import { compareByLabel } from '../utils';
import { buildResourceUri, getIdByUri } from '../utils/UriUtils';
import { UsageTypeBeta } from 'sailpoint-api-client';
import { convertPascalCase2SpaceBased } from '../utils/stringUtils';
import { ExtendedQuickPickItem } from '../models/ExtendedQuickPickItem';
import { openPreview } from '../utils/vsCodeHelpers';
import { TenantService } from '../services/TenantService';
import { WizardContext } from '../wizard/wizardContext';
import { runWizard } from '../wizard/wizard';
import { QuickPickTenantStep } from '../wizard/quickPickTenantStep';
import { Validator } from '../validator/validator';
import { InputPromptStep } from '../wizard/inputPromptStep';
import { QuickPickPromptStep } from '../wizard/quickPickPromptStep';
import { ISCClient } from '../services/ISCClient';



const provisioningPolicyNameValidator = new Validator({
    required: true,
    maxLength: 50,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$'
});


function prepareUsageTypePickItems(): Array<ExtendedQuickPickItem> {
    const FIRST = UsageTypeBeta.Create;
    return Object.keys(UsageTypeBeta).map(key => ({
        label: convertPascalCase2SpaceBased(key),
        description: (UsageTypeBeta[key] === FIRST ? "(default)" : ""),
        value: UsageTypeBeta[key]
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
        const provisioningPolicyName = values["provisioningPolicy"]
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {

            const data = {
                "name": provisioningPolicyName,
                "description": null,
                "usageType": usageType.value,
                "fields": []
            };

            const sourceId = getIdByUri(node.parentUri)
            const newUri = buildResourceUri({
                tenantName: values["tenant"].tenantName,
                resourceType: "sources",
                id: sourceId,
                subResourceType: "provisioning-policies",
                subId: usageType.value,
                name: provisioningPolicyName
            })

            await client.createProvisioningPolicy(sourceId, data)
            vscode.commands.executeCommand(commands.REFRESH_FORCED);
            openPreview(newUri)
        });
    }
}
