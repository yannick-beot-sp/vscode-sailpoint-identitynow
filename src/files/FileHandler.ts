import * as vscode from 'vscode';
import * as commands from '../commands/constants';
import { URL_PREFIX } from '../constants';
import { ISCClient } from '../services/ISCClient';
import { TenantService } from '../services/TenantService';
import { getIdByUri, getResourceUri } from '../utils/UriUtils';
import { openPreview } from '../utils/vsCodeHelpers';

enum FileHandlerObjectType {
    transform = "transforms",
    connectorRule = "connector-rules",
    role = "roles",
    accessProfile = "access-profiles",
}

export class FileHandler {

    constructor(private readonly tenantService: TenantService) { }

    public async onFileSaved(document: vscode.TextDocument) {
        console.log("> onFileSaved", document);
        if (document.uri.scheme !== URL_PREFIX) {
            return;
        }

        const uriRegexp = new RegExp(Object.values(FileHandlerObjectType).join('|'));
        if (!uriRegexp.test(document.uri.path)) {
            return;
        }

        const olduri = document.uri;
        const tenantName = olduri.authority;

        const tenantInfo = await this.tenantService.getTenantByTenantName(tenantName);

        if (tenantInfo === undefined) {
            return;
        }

        //////////////////////////////////////////
        // Get generated object to get the ID
        //////////////////////////////////////////
        const client = new ISCClient(tenantInfo.id!, tenantName);

        // 1. Get name from the document
        const editorText = document.getText();
        const editorObject = JSON.parse(editorText);
        const name = editorObject.name;
        if (!name) {
            console.log('WARNING onFileSaved: no name');
            return;
        }
        console.log('onFileSaved: name = ', name);

        // 2. get the object type
        // going through all object types for a more "dynamic" approach 
        // => you only need to update FileHandlerObjectType
        let resourceType: FileHandlerObjectType;
        const objectType = Object.keys(FileHandlerObjectType).find(x => olduri.path.match(FileHandlerObjectType[x]));
        resourceType = FileHandlerObjectType[objectType];

        // 3. get the object by name to get the new id
        let data: any;
        switch (resourceType) {
            case FileHandlerObjectType.transform:
                data = await client.getTransformByName(name);
                break;
            case FileHandlerObjectType.connectorRule:
                data = await client.getConnectorRuleByName(name);
                break;
            case FileHandlerObjectType.role:
                data = await client.getRoleByName(name);
                break;
            case FileHandlerObjectType.accessProfile:
                data = await client.getAccessProfileByName(name);
                break;
            default:
                break;
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
            const newUri = getResourceUri(tenantName, resourceType, data.id, data.name);

            // Open document and then show document to force JSON
            openPreview(newUri, 'json', false)
            vscode.commands.executeCommand(commands.REFRESH_FORCED)
        }
    }
}