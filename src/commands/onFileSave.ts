import * as vscode from 'vscode';
import { TransformsTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { convertToText } from '../utils';
import { getIdByUri, getNameByUri, getResourceTypeByUri, getResourceUri } from '../utils/UriUtils';


export async function onFileSaved(document: vscode.TextDocument) {
    console.log("> onFileSaved", document);
    if (document.uri.scheme !== "idn") {
        return;
    }

    if (document.uri.path.match('transforms')) {
        const olduri = document.uri;
        // Refresh tree
        const node = new TransformsTreeItem(olduri.authority);
        vscode.commands.executeCommand("vscode-sailpoint-identitynow.refresh", node);

        //////////////////////////////////////////
        // Get generated transform to get the ID
        //////////////////////////////////////////
        const client = new IdentityNowClient(olduri.authority);

        // 1. Get transform name
        const editorText = document.getText();
        const editorObject = JSON.parse(editorText);
        const name = editorObject.name;
        if (!name) {
            console.log('WARNING onFileSaved: no name');
            return;
        }
        console.log('onFileSaved: name = ', name);

        // 2. Get transform to get ID
        // As it is a "search", an array should be returned
        const data = await client.getTransformByName(name);
        if (!data || !(data instanceof Array) || data.length !== 1) {
            console.log('WARNING onFileSaved: could not find transform:', data);
            return;
        }

        const oldid = getIdByUri(document.uri);
        // Check old id and new id and check the active window Uri
        // Close the active window to open the 'new' uri with the id
        if (oldid !== data[0].id && olduri === vscode.window.activeTextEditor?.document.uri) {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            const newUri = getResourceUri(olduri.authority, (getResourceTypeByUri(olduri) || ""), data[0].id, data[0].name);
            
            // Open document and then show document to force JSON
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
        }
    }
}