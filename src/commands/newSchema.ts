import path = require('path');
import * as vscode from 'vscode';
import { SchemasTreeItem } from "../models/IdentityNowTreeItem";
import { isEmpty } from '../utils/stringUtils';
import { getIdByUri, getPathByUri } from '../utils/UriUtils';
import { openPreview } from '../utils/vsCodeHelpers';
import { IdentityNowClient } from '../services/IdentityNowClient';
import * as commands from './constants';

async function askSchemaName(): Promise<string | undefined> {
    const result = await vscode.window.showInputBox({
        value: '',
        ignoreFocusOut: true,
        placeHolder: 'Schema name',
        prompt: "Enter the schema name",
        title: 'Identity Security Cloud',
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

    let schemaName = await askSchemaName() || "";
    if (isEmpty(schemaName)) {
        return;
    }
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Creating File...',
        cancellable: false
    }, async (task, token) => {
        const data = {
            "name": schemaName,
            "nativeObjectType": "",
            "identityAttribute": "",
            "displayAttribute": "",
            "hierarchyAttribute": null,
            "includePermissions": false,
            "features": [],
            "configuration": {},
            "attributes": []
        }

        const client = new IdentityNowClient(treeItem.tenantId, treeItem.tenantName);
        const schema = await client.createSchema(
            getIdByUri(treeItem.parentUri), 
            data)

        const newUri = treeItem.parentUri!.with({
            path: path.posix.join(
                getPathByUri(treeItem.parentUri) || "",
                'schemas',
                schema.id!,
                schemaName
            )
        });

        console.log('newSchema: newUri =', newUri);
        openPreview(newUri)
        vscode.commands.executeCommand(commands.REFRESH_FORCED);
    });
}

