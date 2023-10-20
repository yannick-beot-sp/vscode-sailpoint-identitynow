import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { isEmpty } from '../../utils/stringUtils';
import { NEW_ID } from '../../constants';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { getResourceUri } from '../../utils/UriUtils';
import { Role } from 'sailpoint-api-client';
import { runWizard } from '../../wizard/wizard';
import { InputPromptStep } from '../../wizard/inputPromptStep';
import { QuickPickPromptStep } from '../../wizard/quickPickPromptStep';
import { Validator } from '../../validator/validator';
import { WizardContext } from '../../wizard/wizardContext';

const role: Role = require('../../../snippets/role.json');

/**
 * Command used to open a source or a role
 */
export class NewRoleCommand {

    constructor(private readonly tenantService: TenantService) { }

    async newRole(tenant: RolesTreeItem): Promise<void> {

        console.log("> NewRoleCommand.newRole", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof RolesTreeItem)) {
            console.log("WARNING: NewRoleCommand.newRole: invalid node", tenant);
            throw new Error("NewRoleCommand.newRole: invalid node");
        }
        const tenantName = tenant.tenantName || "";
        if (isEmpty(tenantName)) {
            return;
        }

        const client = new IdentityNowClient(tenant.tenantId, tenant.tenantName);


        const roleNameValidator = new Validator({
            required: true,
            maxLength: 128,
            regexp: '^[A-Za-z0-9 _:;,={}@()#-|^%$!?.*]+$'
        });
        const requiredValidator = new Validator({
            required: true
        });

        const values = await runWizard({
            title: "Creation of a role",
            hideStepCount: false,
            promptSteps: [
                new InputPromptStep({
                    name: "role",
                    options: {
                        validateInput: (s: string) => { return roleNameValidator.validate(s); }
                    }
                }),
                new InputPromptStep({
                    name: "ownerQuery",
                    displayName: "owner",
                    options: {
                        validateInput: (s: string) => { return requiredValidator.validate(s); }
                    }
                }),
                new QuickPickPromptStep({
                    name: "owner",
                    displayName: "role owner",
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const results = (await client.searchIdentities(context["ownerQuery"], 100, ["id", "name", "displayName", "email"]))
                            .map(x => {
                                const email = x.email ? `(${x.email})` : undefined;
                                const description = x.displayName ? [x.displayName, email].join(' ') : x.email;

                                return {
                                    ...x,
                                    label: x.name,
                                    description
                                };
                            });

                        return results;
                    }
                }),
                new InputPromptStep({
                    name: "accessProfileQuery",
                    displayName: "access profile",
                    options: {
                        validateInput: (s: string) => { return requiredValidator.validate(s); }
                    }
                }),
                new QuickPickPromptStep({
                    name: "accessProfile",
                    displayName: "access profile",
                    items: async (context: WizardContext): Promise<vscode.QuickPickItem[]> => {
                        const results = (await client.searchAccessProfiles(context["accessProfileQuery"], 100, ["id", "name", "description"]))
                            .map(x => ({
                                id: x.id,
                                label: x.name,
                                name: x.name,
                                detail: x.description
                            }));

                        return results;
                    }
                }),
            ]
        });
        console.log({ values });
        if (values === undefined) { return; }

        // Deep copy of "role"
        const newRole = JSON.parse(JSON.stringify(role));

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {
            const name = values["role"].trim();
            const newUri = getResourceUri(tenantName, 'roles', NEW_ID, name);
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: true });

            const edit = new vscode.WorkspaceEdit();
            newRole.name = name;
            newRole.owner.id = values["owner"].id;
            newRole.owner.name = values["owner"].name.trim();
            newRole.owner.type = 'IDENTITY';

            newRole.accessProfiles.push({
                id: values["accessProfile"].id,
                name: values["accessProfile"].name,
                type: 'ACCESS_PROFILE'
            });

            const strContent = JSON.stringify(newRole, null, 4);
            edit.insert(newUri, new vscode.Position(0, 0), strContent);
            let success = await vscode.workspace.applyEdit(edit);
        });
    }

}