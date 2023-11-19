import path = require('path');
import * as vscode from 'vscode';
import { NEW_ID } from '../constants';
import { SchemasTreeItem } from "../models/IdentityNowTreeItem";
import { isEmpty } from '../utils/stringUtils';
import { getPathByUri } from '../utils/UriUtils';



async function askSchemaName(): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder: 'Schema name',
        prompt: "Enter the schema name",
        title: 'IdentityNow',
        validateInput: text => {
            const regex = new RegExp('^[A-Za-z]+$');
            if (regex.test(text)) {
                return null;
            }
            return "Invalid schema name";
        }
    });
    return result;
}

/**
 * Command used to create a new provisionnig policy
 */
export async function newSchema(treeItem: SchemasTreeItem): Promise<void> {

    console.log("> newSchema", treeItem);

    // assessing that item is a TenantTreeItem
    if (treeItem === undefined || !(treeItem instanceof SchemasTreeItem)) {
        console.log("WARNING: newSchema: invalid node", treeItem);
        throw new Error("newSchema: invalid node");
    }
    const tenantName = treeItem.tenantName || "";
    if (isEmpty(tenantName)) {
        return;
    }

    let schemaName = await askSchemaName() || "";
    if (isEmpty(schemaName)) {
        return;
    }
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Creating File...',
        cancellable: false
    }, async (task, token) => {

        const newUri = treeItem.parentUri?.with({
            path: path.posix.join(
                getPathByUri(treeItem.parentUri) || "",
                'schemas',
                NEW_ID,
                schemaName
            )
        });
        console.log('newSchema: newUri =', newUri);
        if (!newUri) { return; }
        let document = await vscode.workspace.openTextDocument(newUri);
        // const untitled = vscode.Uri.parse(newUri).with({ scheme: 'untitled' });
        // let document = await vscode.workspace.openTextDocument(untitled);
        document = await vscode.languages.setTextDocumentLanguage(document, 'json');

        if (token.isCancellationRequested) {
            return;
        }
        await vscode.window.showTextDocument(document, { preview: true });

    });
}

