import * as vscode from 'vscode';
import { TenantService } from "../../services/TenantService";
import { AccessProfilesTreeItem } from '../../models/IdentityNowTreeItem';
import { compareByName, isEmpty } from '../../utils';
import { NEW_ID } from '../../constants';
import { AccessProfile } from '../../models/AccessProfile';
import { IdentityNowClient } from '../../services/IdentityNowClient';
import { getResourceUri } from '../../utils/UriUtils';

const accessProfile: AccessProfile = require('../../../snippets/access-profile.json');

/**
 * Command used to open a source or a access profile
 */
export class NewAccessProfileCommand {

    constructor(private readonly tenantService: TenantService) { }

    async newAccessProfile(tenant: AccessProfilesTreeItem): Promise<void> {

        console.log("> NewAccessProfileCommand.newAccessProfile", tenant);

        // assessing that item is a TenantTreeItem
        if (tenant === undefined || !(tenant instanceof AccessProfilesTreeItem)) {
            console.log("WARNING: NewAccessProfileCommand.newAccessProfile: invalid node", tenant);
            throw new Error("NewAccessProfileCommand.newAccessProfile: invalid node");
        }
        const tenantName = tenant.tenantName || "";
        if (isEmpty(tenantName)) {
            return;
        }

        const client = new IdentityNowClient(tenant.tenantId, tenant.tenantName);

        vscode.window.showInformationMessage('Retrieving reference data, this may a few moments...');

        // Get Sources and Identities
        const sources = await client.getSources();
        const identities = await client.getIdentities();

        let name = await this.askName() || "";
        if (isEmpty(name)) {
            return;
        }

        const owner = await this.askOwner(identities);
        if (!owner) {
            return;
        }

        const source = await this.askSource(sources);
        if (!source) {
            return;
        }

        const entitlement = await this.askEntitlement(client, source.id);
        if (!entitlement) {
            return;
        }

        let newAccessProfile = accessProfile;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating File...',
            cancellable: false
        }, async (task, token) => {

            const newUri = getResourceUri(tenantName, 'access-profiles', NEW_ID, name);
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: true });

            const edit = new vscode.WorkspaceEdit();
            newAccessProfile.name = name.trim();
            newAccessProfile.owner.id = owner.id;
            newAccessProfile.owner.name = owner.name.trim();
            newAccessProfile.owner.type = 'IDENTITY';

            newAccessProfile.source = {
                id: source.id,
                name: source.name,
                type: 'SOURCE'
            };

            newAccessProfile.entitlements.push({
                id: entitlement.id,
                name: entitlement.name,
                type: 'ENTITLEMENT'
            });

            const strContent = JSON.stringify(newAccessProfile, null, 4);
            edit.insert(newUri, new vscode.Position(0, 0), strContent);
            let success = await vscode.workspace.applyEdit(edit);
        });
    }

    private async askName(): Promise<string | undefined> {
        const result = await vscode.window.showInputBox({
            value: '',
            ignoreFocusOut: true,
            placeHolder: 'Access Profile name',
            prompt: "Enter the Access Profile name",
            title: 'IdentityNow',
            validateInput: text => {
                if (text && text.length > 128) {
                    return "Access Profile name cannot exceed 128 characters.";
                }

                if (text === '') {
                    return "You must provide a Access Profile name.";
                }

                // '+' removed from allowed character as known issue during search/filter of access profile 
                // If search/filter is failing, the access profile is not properly closed and reopened
                const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$', 'i');
                if (regex.test(text)) {
                    return null;
                }
                return "Invalid Access Profile name";
            }
        });
        return result?.trim();
    }

    private async showPickSource(sources: any[], title: string): Promise<any | undefined> {
        const sourcesPickList = sources
            .sort(compareByName)
            .map((obj: { name: any; description: any; }) => ({ ...obj, label: obj.name, detail: obj.description }));

            sourcesPickList.forEach((obj: { description: any; }) => delete obj.description);

        const source = await vscode.window.showQuickPick(sourcesPickList, {
            ignoreFocusOut: false,
            title: title,
            canPickMany: false
        });
        if (source?.label) {
            source.description = source.detail;
            // @ts-ignore
            delete source.label;
            delete source.detail;
        }
        return source;
    }

    private async askSource(sources: any[]): Promise<any | undefined> {
        return await this.showPickSource(sources, 'Select Source');
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

    private async showPickEntitlements(entitlements: any[], title: string): Promise<any | undefined> {
        const entitlementPickList = entitlements
            .sort(compareByName)
            .map((obj: { name: any; description: any; }) => ({ ...obj, label: obj.name, detail: obj.description }));

            entitlementPickList.forEach((obj: { description: any; }) => delete obj.description);

        const entitlement = await vscode.window.showQuickPick(entitlementPickList, {
            ignoreFocusOut: false,
            title: title,
            canPickMany: false
        });
        if (entitlement?.label) {
            entitlement.description = entitlement.detail;
            // @ts-ignore
            delete entitlement.label;
            delete entitlement.detail;
        }
        return entitlement;
    }

    private async askEntitlement(client: IdentityNowClient, sourceId: string): Promise<any | undefined> {
        vscode.window.showInformationMessage('Fetching entitlements, this may a few moments...');
        const entitlements = await client.getEntitlementsBySource(sourceId);
        return await this.showPickEntitlements(entitlements, 'Select Entitlements');
    }
}