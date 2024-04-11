import * as vscode from 'vscode';

import { IdentitiesDefinitionTreeItem } from '../../models/ISCTreeItem';
import { TenantService } from "../../services/TenantService";
import { ISCClient } from '../../services/ISCClient';
//import { IdentitiesBetaApiStartIdentityProcessingRequest,ProcessIdentitiesRequestBeta } from 'sailpoint-api-client';

export class IdentityDefinitionTreeViewCommand {

    constructor(private readonly tenantService: TenantService) { }

    //Never used but a Promise is a promise
    async execute(identityTreeItem?: IdentitiesDefinitionTreeItem): Promise<void> {
        console.log("> IdentityDefinitionImporterTreeViewCommand.execute");

        if (identityTreeItem ===undefined) {
            return;
        }        
    }
    
    async deleteIdentity(identityTreeItem?: IdentitiesDefinitionTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.deleteIdentity");

        if (identityTreeItem ===undefined) {
            return;
        }        

        vscode.window
                .showInformationMessage(`Are you sure you want to delete ${identityTreeItem.label}?`, "Yes", "No")
                .then(answer => {
                    if (answer === "Yes") {
                        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
                        client.deleteIdentity(identityTreeItem.id);                        
                        vscode.window.showInformationMessage("Identity Delete started");
                    }
                    if(answer === "No") {
                        vscode.window.showInformationMessage(`${identityTreeItem.label} is safe ... for now`);
                    }
                })                
    }

    async attSyncIdentity(identityTreeItem?: IdentitiesDefinitionTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.attSyncIdentity");

        if (identityTreeItem ===undefined) {
            return;
        }        

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);
        client.syncIdentityAttributes(identityTreeItem.id);
        
        vscode.window.showInformationMessage("Identity Att Sync started");
    }

    async processIdentity(identityTreeItem?: IdentitiesDefinitionTreeItem): Promise<void> {
        console.log("> IdentityDefinitionTreeViewCommand.processIdentity");

        if (identityTreeItem ===undefined) {
            return;
        }        

        const client = new ISCClient(identityTreeItem.tenantId, identityTreeItem.tenantName);        
        let identities = { processIdentitiesRequestBeta:
                            {
                                identityIds:[identityTreeItem.id]
                            }
                        };        
        
        client.processIdentities(identities);

        vscode.window.showInformationMessage("Identity process started");
/*
        const roleImporter = new RoleImporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            fileUri
        );
        await roleImporter.importFileWithProgression();
        */
    }

    //Possible future actions?                    
    //lcsApi.setLifecycleState()
}