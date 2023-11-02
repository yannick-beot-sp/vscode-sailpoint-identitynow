import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { NEW_ID } from '../../constants';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { getResourceUri } from '../../utils/UriUtils';
import { Role } from 'sailpoint-api-client';
import { runWizard } from '../../wizard/wizard';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep';
import { Validator } from '../../validator/validator';
import { WizardContext } from '../../wizard/wizardContext';
import { QuickPickTenantStep } from '../../wizard/quickPickTenantStep';
import { requiredValidator } from '../../validator/requiredValidator';
import { InputOwnerStep } from '../../wizard/inputOwnerStep';
import { QuickPickOwnerStep } from '../../wizard/quickPickOwnerStep';
import { createNewFile } from '../../utils/vsCodeHelpers';

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
            context["tenant"] = await this.tenantService.getTenant(rolesTreeItem.tenantId);
        }

        let client: IdentityNowClient | undefined = undefined;

        const values = await runWizard({
            title: "Creation of a role",
            hideStepCount: false,
            promptSteps: [
                new QuickPickTenantStep(
                    this.tenantService,
                    async (wizardContext) => {
                        client = new IdentityNowClient(
                            wizardContext["tenant"].id, wizardContext["tenant"].tenantName);
                    }),
                new InputPromptStep({
                    name: "role",
                    options: {
                        validateInput: (s: string) => { return roleNameValidator.validate(s); }
                    }
                }),
                new InputOwnerStep(),
                new QuickPickOwnerStep(
                    "role owner",
                    () => { return client; }
                ),
                new InputPromptStep({
                    name: "accessProfileQuery",
                    displayName: "access profile",
                    options: {
                        validateInput: (s: string) => { return requiredValidator.validate(s); }
                    }
                }),
                new QuickPickPromptStep({
                    name: "accessProfiles",
                    displayName: "access profiles",
                    options: {
                        canPickMany: true
                    },
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const results = (await client.searchAccessProfiles(context["accessProfileQuery"], 100, ["id", "name", "description", "source.name"]))
                            .map(x => ({
                                id: x.id,
                                label: x.name,
                                name: x.name,
                                description: x.source.name,
                                detail: x.description
                            }));

                        return results;
                    }
                }),
            ]
        }, context);
        console.log({ values });
        if (values === undefined) { return; }

        // Deep copy of "role" template
        const newRole: Role = JSON.parse(JSON.stringify(role));

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {
            const name = values["role"].trim();
            const tenantName = values["tenant"].tenantName;
            const newUri = getResourceUri(tenantName, 'roles', NEW_ID, name);

            newRole.name = name;
            newRole.owner = {
                id: values["owner"].id,
                name: values["owner"].name,
                type: "IDENTITY"
            };
            newRole.accessProfiles.push(...values["accessProfiles"].map(x => ({
                id: x.id,
                name: x.name,
                type: 'ACCESS_PROFILE'
            })));

            await createNewFile(newUri, newRole);
        });
    }
}