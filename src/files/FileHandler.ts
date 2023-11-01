import * as vscode from 'vscode';
import { URL_PREFIX } from '../constants';
import { RolesTreeItem, RulesTreeItem, TransformsTreeItem } from '../models/IdentityNowTreeItem';
import { IdentityNowClient } from '../services/IdentityNowClient';
import { TenantService } from '../services/TenantService';
import { getIdByUri, getResourceUri } from '../utils/UriUtils';
import * as commands from '../commands/constants';


export class FileHandler {

    constructor(private readonly tenantService: TenantService) { }

    public async onFileSaved(document: vscode.TextDocument) {
        console.log("> onFileSaved", document);
        if (document.uri.scheme !== URL_PREFIX) {
            return;
        }

        if (!document.uri.path.match(/transforms|connector-rules|roles/)) {
            return;
        }

        const olduri = document.uri;
        const tenantName = olduri.authority;
        // Refresh tree
        let node: any;
        let resourceType: string;
        let isBeta = false;
        const tenantInfo = await this.tenantService.getTenantByTenantName(tenantName);
        
        if (tenantInfo === undefined) {
            return;
        }

        //////////////////////////////////////////
        // Get generated object to get the ID
        //////////////////////////////////////////
        const client = new IdentityNowClient(tenantInfo.id!, tenantName);

        // 1. Get name from the document
        const editorText = document.getText();
        const editorObject = JSON.parse(editorText);
        const name = editorObject.name;
        if (!name) {
            console.log('WARNING onFileSaved: no name');
            return;
        }
        console.log('onFileSaved: name = ', name);

        // 2. get the object by name to get the new id
        let data: any;
        if (resourceType === 'transforms') {
            data = await client.getTransformByName(name);
        } else if (resourceType === 'connector-rules') {
            data = await client.getConnectorRuleByName(name);
        } else if (resourceType === 'roles') {
            data = await client.getRoleByName(name);
        }

        if (!data) {
            console.log('WARNING onFileSaved: could not find ' + resourceType + ':', data);
            return;
        }

        const oldid = getIdByUri(olduri);
        // Check old id and new id and check the active window Uri
        // Close the active window to open the 'new' uri with the id
        if (oldid !== data.id && olduri === vscode.window.activeTextEditor?.document.uri) {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            const newUri = getResourceUri(tenantName, resourceType, data.id, data.name, isBeta);

            // Open document and then show document to force JSON
            let document = await vscode.workspace.openTextDocument(newUri);
            document = await vscode.languages.setTextDocumentLanguage(document, 'json');
            await vscode.window.showTextDocument(document, { preview: false, preserveFocus: true });
        }
    }
}