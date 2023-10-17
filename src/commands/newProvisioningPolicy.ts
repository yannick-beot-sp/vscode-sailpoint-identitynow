import path = require('path');
import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { ProvisioningPoliciesTreeItem } from "../models/IdentityNowTreeItem";
import { isEmpty, str2Uint8Array } from '../utils';
import { getPathByUri } from '../utils/UriUtils';
import { UsageTypeBeta } from 'sailpoint-api-client';
import { convertPascalCase2SpaceBased } from '../utils/stringUtils';
import { ProvisioningPolicyTypeQuickPickItem } from '../models/ProvisioningPolicyTypeQuickPickItem';



function prepareUsageTypePickItems(): Array<ProvisioningPolicyTypeQuickPickItem> {
    const FIRST = UsageTypeBeta.Create;
    return Object.keys(UsageTypeBeta).map(key => ({
        label: convertPascalCase2SpaceBased(key),
        description: (UsageTypeBeta[key] === FIRST ? "(default)" : ""),
        value: UsageTypeBeta[key]
    }))
        .sort(((a, b) => (a.label > b.label) ? 1 : -1))
        // To move "Create" at the top. cf. https://stackoverflow.com/a/23921775
        .sort((a, b) => a.value === FIRST ? -1 : b.value === FIRST ? 1 : 0);
}


async function askProvisioningPolicyType(): Promise<string | undefined> {

    const typePickList = prepareUsageTypePickItems();
    const result = await vscode.window.showQuickPick(typePickList, {
        ignoreFocusOut: true,
        title: "Type of provisioning policy",
        canPickMany: false
    });

    return result?.value;
}

async function askProvisioningPolicyName(): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder: 'Provisioning Policy name',
        prompt: "Enter the provisioning policy name",
        title: 'IdentityNow',
        validateInput: text => {
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

    const usageType = await askProvisioningPolicyType();
    if (usageType === undefined) {
        return;
    }


    const provisioningPolicyName = await askProvisioningPolicyName() || "";
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
                usageType
            )
        });
        if (!newUri) { return; }
        const data = {
            "name": provisioningPolicyName,
            "description": null,
            "usageType": usageType,
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
                usageType,
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
