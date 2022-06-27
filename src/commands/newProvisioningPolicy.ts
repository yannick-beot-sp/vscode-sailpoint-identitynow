import path = require('path');
import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { ProvisioningPoliciesTreeItem, TransformsTreeItem } from "../models/IdentityNowTreeItem";
import { isEmpty, str2Uint8Array } from '../utils';
import { getPathByUri, getResourceUri } from '../utils/UriUtils';


async function askProvisioningPolicyName(): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder: 'Provisioning Policy name',
        prompt: "Enter the provisioning policy name",
        title: 'IdentityNow',
        validateInput: text =>
        {
            if (text && text.length > 50) {
                return "Provisioning Policy name cannot exceed 50 characters.";
            }

            if (text === '') {
                return "You must provide a Provisioning Policy name.";
            }

            // '+' removed from allowed character as known issue during search/filter of transform 
            // If search/filter is failing, the transform is not properly closed and reopened
            const regex = new RegExp('^[a-z0-9 _:;,={}@()#-|^%$!?.*]{1,50}$', 'i');
            if (regex.test(text)) {
                return null;
            }
            return "Invalid Provisioning Policy name";
        } 
    });
    return result;
}
/**
 * Command used to create a new provisionnig policy
 */
export async function newProvisioningPolicy(treeItem: ProvisioningPoliciesTreeItem): Promise<void> {

    console.log("> newProvisioningPolicy", treeItem);

    // assessing that item is a TenantTreeItem
    if (treeItem === undefined || !(treeItem instanceof ProvisioningPoliciesTreeItem)) {
        console.log("WARNING: newProvisioningPolicy: invalid node", treeItem);
        throw new Error("newProvisioningPolicy: invalid node");
    }
    const tenantName = treeItem.tenantName || "";
    if (isEmpty(tenantName)) {
        return;
    }
    let provisioningPolicyName = await askProvisioningPolicyName() || "";
    if (isEmpty(provisioningPolicyName)) {
        return;
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Creating File...',
        cancellable: false
    }, async (task, token) => {

        let newUri = treeItem.parentUri?.with({
            path: path.posix.join(
                getPathByUri(treeItem.parentUri) || "",
                'provisioning-policies',
                NEW_ID,
                'CREATE'
            )
        });
        if (!newUri) { return; }
        const data = {
            "name": provisioningPolicyName,
            "description": null,
            "usageType": "CREATE",
            "fields": []
        };
        await vscode.workspace.fs.writeFile(
            newUri,
            str2Uint8Array(JSON.stringify(data))
        );
        newUri = treeItem.parentUri?.with({
            path: path.posix.join(
                getPathByUri(treeItem.parentUri) || "",
                'provisioning-policies',
                'CREATE',
                provisioningPolicyName
            )
        });
        if (!newUri) { return; }
        let document = await vscode.workspace.openTextDocument(newUri);
        document = await vscode.languages.setTextDocumentLanguage(document, 'json');

        if (token.isCancellationRequested) {
            return;
        }
        await vscode.window.showTextDocument(document, { preview: true });

    });
}
