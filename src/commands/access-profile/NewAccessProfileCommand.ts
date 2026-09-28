import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService.js";
import { AccessProfilesTreeItem } from '../../models/ISCTreeItem.js';
import { NEW_ID } from '../../constants.js';
import { ISCClient } from '../../services/ISCClient.js';
import { getResourceUri } from '../../utils/UriUtils.js';
import { AccessProfile } from 'sailpoint-api-client/dist/access_profiles/api.js';
import { Entitlement } from 'sailpoint-api-client/dist/entitlements/api.js';
import { runWizard } from '../../wizard/wizard.js';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep.js';
import { InputPromptStep } from '../../wizard/inputPromptStep.js';
import { QuickPickIdentityStep } from '../../wizard/quickPickIdentityStep.js';
import { Validator } from '../../validator/validator.js';
import { WizardContext } from '../../wizard/wizardContext.js';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep.js';
import { createNewFile } from '../../utils/vsCodeHelpers.js';
import { QuickPickSourceStep } from '../../wizard/quickPickSourceStep.js';
import { InputIdentityQueryStep } from '../../wizard/inputIdentityQueryStep.js';
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const accessProfileTemplate: AccessProfile = require('../../../snippets/access-profile.json');

const accessProfileNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});

/**
 * Command used to create an access profile
 */
export class NewAccessProfileCommand {

    constructor(private readonly tenantService: TenantService) { }

    async newAccessProfile(accessProfilesTreeItem: AccessProfilesTreeItem): Promise<void> {

        console.log("> NewAccessProfileCommand.newAccessProfile", accessProfilesTreeItem);
        const context: WizardContext = {};
        // if the command is called from the Tree View
        if (accessProfilesTreeItem !== undefined && accessProfilesTreeItem instanceof AccessProfilesTreeItem) {
            context["tenant"] = this.tenantService.getTenant(accessProfilesTreeItem.tenantId);
        }

        let client: ISCClient | undefined = undefined;

        const values = await runWizard({
            title: "Creation of an access profile",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create an access profile"),
                new InputPromptStep({
                    name: "accessProfile",
                    options: {
                        validateInput: (s: string) => { return accessProfileNameValidator.validate(s); }
                    }
                }),
                new InputIdentityQueryStep(),
                new QuickPickIdentityStep(
                    "access profile owner",
                    () => { return client!; }
                ),
                new QuickPickSourceStep(() => { return client!; }),
                new QuickPickPromptStep({
                    name: "entitlements",
                    options: {
                        canPickMany: true,
                        matchOnDetail: true
                    },
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const results = (await client!.getAllEntitlementsBySource(context["source"].id))
                            .map((x: Entitlement) => ({
                                id: x.id!,
                                label: x.name!,
                                name: x.name!,
                                detail: x.description,
                                description: x.attribute
                            }));

                        return results;
                    }
                }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        // Deep copy of "accessProfileTemplate"
        const newAccessProfile: AccessProfile = JSON.parse(JSON.stringify(accessProfileTemplate));


        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {
            const name = values["accessProfile"].trim();
            const tenantName = values["tenant"].tenantName;
            const newUri = getResourceUri(tenantName, 'access-profiles', NEW_ID, name);

            newAccessProfile.name = name;
            newAccessProfile.owner = {
                id: values["owner"].id,
                name: values["owner"].name,
                type: "IDENTITY"
            };

            newAccessProfile.source = {
                id: values["source"].id,
                name: values["source"].name,
                type: 'SOURCE'
            };

            newAccessProfile.entitlements?.push(...values["entitlements"].map((x: Entitlement) => ({
                id: x.id,
                name: x.name,
                type: 'ENTITLEMENT'
            })));

            await createNewFile(newUri, newAccessProfile);
        });
    }
}
