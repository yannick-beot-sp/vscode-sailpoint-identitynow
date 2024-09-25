import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { RolesTreeItem } from '../../models/ISCTreeItem';
import { NEW_ID } from '../../constants';
import { ISCClient } from '../../services/ISCClient';
import { getResourceUri } from '../../utils/UriUtils';
import { Role, RoleMembershipSelectorType } from 'sailpoint-api-client';
import { runWizard } from '../../wizard/wizard';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { Validator } from '../../validator/validator';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { InputIdentityQueryStep } from '../../wizard/inputIdentityQueryStep';
import { QuickPickIdentityStep } from '../../wizard/quickPickIdentityStep';
import { createNewFile } from '../../utils/vsCodeHelpers';
import { isNotBlank } from '../../utils/stringUtils';
import { Parser } from '../../parser/parser';
import { RoleMembershipSelectorConverter } from '../../parser/RoleMembershipSelectorConverter';
import { SourceNameToIdCacheService } from '../../services/cache/SourceNameToIdCacheService';
import { QuickPickAccessProfileStep } from '../../wizard/quickPickAccessProfileStep';
import { QuickPickEntitlementStep } from '../../wizard/quickPickEntitlementStep';

const role: Role = require('../../../snippets/role.json');


const roleNameValidator = new Validator({
    required: true,
    maxLength: 128,
    regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
});


/**
 * Command used to create a role
 */
export class NewRoleCommand {

    constructor(private readonly tenantService: TenantService) { }

    async newRole(rolesTreeItem?: RolesTreeItem): Promise<void> {

        console.log("> NewRoleCommand.newRole", rolesTreeItem);
        const context: WizardContext = {};

        // if the command is called from the Tree View
        if (rolesTreeItem !== undefined && rolesTreeItem instanceof RolesTreeItem) {
            context["tenant"] = this.tenantService.getTenant(rolesTreeItem.tenantId);
        }

        let client: ISCClient | undefined = undefined;
        const parser = new Parser();
        const values = await runWizard({
            title: "Creation of a role",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new ISCClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    },
                    "create a role"),
                new InputPromptStep({
                    name: "role",
                    options: {
                        validateInput: (s: string) => { return roleNameValidator.validate(s); }
                    }
                }),
                new InputIdentityQueryStep(),
                new QuickPickIdentityStep(
                    "role owner",
                    () => { return client; }
                ),
                new InputPromptStep({
                    name: "accessProfileQuery",
                    options: {
                        prompt: "Enter a query to find access profiles or leave empty",
                        placeHolder: "Enter search query",
                        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-access-profile-data"
                    }
                }),
                new QuickPickAccessProfileStep({ getISCClient: () => { return client; } }),
                new InputPromptStep({
                    name: "entitlementQuery",
                    options: {
                        prompt: "Enter a query to find entitlements or leave empty",
                        placeHolder: "Enter search query",
                        learnMoreLink: "https://documentation.sailpoint.com/saas/help/search/searchable-fields.html#searching-entitlement-data"
                    }
                }),
                new QuickPickEntitlementStep(() => { return client; }),
                new InputPromptStep({
                    name: "membershipCriteria",
                    displayName: "membership criteria",
                    options: {
                        prompt: "Enter a membership criteria if needed",
                        placeHolder: "Membership criteria (e.g identity.cloudLifecycleState eq 'active')",
                        validateInput: (s: string) => {
                            if (isNotBlank(s)) {
                                try {
                                    const _ = parser.parse(s);
                                } catch (error) {
                                    return `Invalid membership criteria`;
                                }
                            }
                            // no error
                            return undefined;
                        }
                    }
                }),
            ]
        }, context);
        
        if (values === undefined) { return; }

        // Deep copy of "role" template
        const newRole: Role = JSON.parse(JSON.stringify(role));

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async () => {
            const name = values["role"].trim();
            const tenantName = values["tenant"].tenantName;
            const newUri = getResourceUri(tenantName, 'roles', NEW_ID, name);

            newRole.name = name;

            newRole.owner = {
                id: values["owner"].id,
                name: values["owner"].name,
                type: "IDENTITY"
            };
            if (values.hasOwnProperty("accessProfiles") && values["accessProfiles"] !== undefined) {
                // Wizard with skipIfOne=true does not always return an array
                let accessProfiles = values["accessProfiles"]
                if (!Array.isArray(accessProfiles)) {
                    accessProfiles = [accessProfiles]
                }
                newRole.accessProfiles.push(...accessProfiles.map(x => ({
                    id: x.id,
                    name: x.name,
                    type: 'ACCESS_PROFILE'
                })));
            }
            if (values.hasOwnProperty("entitlements") && values["entitlements"] !== undefined) {
                // Wizard with skipIfOne=true does not always return an array
                let entitlements = values["entitlements"]
                if (!Array.isArray(entitlements)) {
                    entitlements = [entitlements]
                }
                newRole.entitlements.push(...entitlements.map(x => ({
                    id: x.id,
                    name: x.name,
                    type: 'ENTITLEMENT'
                })));
            }

            if (isNotBlank(values["membershipCriteria"])) {
                try {
                    const expression = parser.parse(values["membershipCriteria"]);
                    const sourceCacheService = new SourceNameToIdCacheService(client);
                    const converter = new RoleMembershipSelectorConverter(sourceCacheService);
                    await converter.visitExpression(expression, undefined);

                    const membership = {
                        type: RoleMembershipSelectorType.Standard,
                        criteria: converter.root
                    };
                    newRole.membership = membership;

                } catch (error) {
                    vscode.window.showErrorMessage(`Could not create the role: ${error}`);
                    return;
                }
            }

            await createNewFile(newUri, newRole);
        });
    }
}
