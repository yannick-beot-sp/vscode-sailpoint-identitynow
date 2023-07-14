import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { compareByName, isEmpty } from '../../utils';
import { NEW_ID } from '../../constants';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { getResourceUri } from '../../utils/UriUtils';
import { Role } from '../../models/Role';

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

        vscode.window.showInformationMessage('Retrieving reference data, this may a few moments...');

        // Get Sources and Identities
        const accessProfiles = await client.getAccessProfiles();
        const identities = await client.getIdentities();

        let name = await this.askName() || "";
        if (isEmpty(name)) {
            return;
        }

        const owner = await this.askOwner(identities);
        if (!owner) {
            return;
        }

        const accessProfile = await this.askAccessProfiles(accessProfiles);
        if (!accessProfile) {
            return;
        }


        let newRole = role;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {

            const newUri = getResourceUri(tenantName, 'roles', NEW_ID, name);
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: true });

            const edit = new vscode.WorkspaceEdit();
            newRole.name = name.trim();
            newRole.owner.id = owner.id;
            newRole.owner.name = owner.name.trim();
            newRole.owner.type = 'IDENTITY';

            newRole.accessProfiles.push({
                id: accessProfile.id,
                name: accessProfile.name,
                type: 'ACCESS_PROFILE'
            });

            const strContent = JSON.stringify(newRole, null, 4);
            edit.insert(newUri, new vscode.Position(0, 0), strContent);
            let success = await vscode.workspace.applyEdit(edit);
        });
    }

    private async askName(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'Role name',
            prompt: "Enter the Role name",
            title: 'IdentityNow',
            validateInput: text => {
                if (text && text.length > 128) {
                    return "Role name cannot exceed 128 characters.";
                }

                if (text === '') {
                    return "You must provide a Role name.";
                }

                // '+' removed from allowed character as known issue during search/filter of role
                // If search/filter is failing, the role is not properly closed and reopened
                const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid Role name";
            }
        });
        return result?.trim();
    }

    private async showPickAccessProfile(accessProfiles: any[], title: string): Promise<any | undefined> {
        const accessProfilesPickList = accessProfiles
            .sort(compareByName)
            .map((obj: { name: any; description: any; }) => ({ ...obj, label: obj.name, detail: obj.description }));

            accessProfilesPickList.forEach((obj: { description: any; }) => delete obj.description);

        const accessProfile = await vscode.window.showQuickPick(accessProfilesPickList, {
            ignoreFocusOut: false,
            title: title,
            canPickMany: false
        });
        if (accessProfile?.label) {
            accessProfile.description = accessProfile.detail;
            // @ts-ignore
            delete accessProfile.label;
            delete accessProfile.detail;
        }
        return accessProfile;
    }

    private async askAccessProfiles(accessProfiles: any[]): Promise<any | undefined> {
        return await this.showPickAccessProfile(accessProfiles, 'Select Access Profile');
    }

    private async showPickOwner(identities: any[], title: string): Promise<any | undefined> {
        const identityPickList = identities
            .sort(compareByName)
            .map((obj: { name: any; description: any; }) => ({ ...obj, label: obj.name, detail: obj.name }));

            identityPickList.forEach((obj: { description: any; }) => delete obj.description);

        const identity = await vscode.window.showQuickPick(identityPickList, {
            ignoreFocusOut: false,
            title: title,
            canPickMany: false
        });
        if (identity?.label) {
            identity.description = identity.detail;
            // @ts-ignore
            delete identity.label;
            delete identity.detail;
        }
        return identity;
    }

    private async askOwner(identities: any[]): Promise<any | undefined> {
        return await this.showPickOwner(identities, 'Select Owner');
    }
}