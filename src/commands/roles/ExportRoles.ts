import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { Role } from '../../models/Role';
import RolePaginator from './RolePaginator';
import { isEmpty } from 'lodash';

export class RoleExporterCommand {
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: RolesTreeItem) {
        console.log("> AccessProfileExporterCommand.execute");

        if (node === undefined) {
            console.error("WARNING: RoleExporterCommand: invalid item", node);
            throw new Error("RoleExporterCommand: invalid item");
        }

        const proposedPath = PathProposer.getGenericCSVFilename(
            node.tenantName,
            node.tenantDisplayName,
            "Roles"
        );

        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );

        if (filePath === undefined) {
            return;
        }

        const exporter = new RoleExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class RoleExporter extends BaseCSVExporter<Role> {
    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        path: string
    ) {
        super("roles",
            tenantId,
            tenantName,
            tenantDisplayName,
            '', // Base exported forces sourceId, but we do not need to use it in here, so leaving it blank.
            path);
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> RoleExporter.exportFile");
        const headers = [
            "name",
            "description",
            "enabled",
            "owner",
            "commentsRequired",
            "denialCommentsRequired",
            "approvalSchemes",
            "revokeCommentsRequired", 
            "revokeDenialCommentsRequired", 
            "revokeApprovalSchemes", 
            "accessProfiles"
        ];
        const paths = [
            "name",
            "descriptionXXX",
            "enabled",
            "owner.name",
            "accessRequestConfig.denialCommentsRequired",
            "accessRequestConfig.denialCommentsRequired",
            "approvalSchemes",
            "revocationRequestConfig.denialCommentsRequired", 
            "revocationRequestConfig.denialCommentsRequired", 
            "revokeApprovalSchemes",
            "accessProfiles"
        ];
        const unwindablePaths: string[] = [];

        const governanceGroups = await this.client.getGovernanceGroups();

        const customTransform: any[] | undefined = [
            function(item:any) {
                let accessProfiles = '';
                
                for (let index = 0; index < item.accessProfiles.length; index++){
                    const app = item.accessProfiles[index];
                    accessProfiles += app.name + ';';
                }
                item.accessProfiles = accessProfiles.substring(0, accessProfiles.length-1);
                if (item.accessRequestConfig) {
                    let approvalSchemes = '';
                    for (let index = 0; index < item.accessRequestConfig.approvalSchemes.length; index++){
                        const scheme = item.accessRequestConfig.approvalSchemes[index];
                        
                        if (scheme.approverType === 'GOVERNANCE_GROUP') {
                            let governanceGroupName = '';
                            if (governanceGroups !== undefined && governanceGroups instanceof Array) {
                                for (let group of governanceGroups) {
                                    if (group.id.trim() === scheme.approverId.trim()) {
                                        governanceGroupName =  group.name;
                                    }
                                }
                            }
                            
                            if (!isEmpty(governanceGroupName)) {
                                approvalSchemes += governanceGroupName  + ';';
                            }
                        } else {
                            approvalSchemes += scheme.approverType  + ';';
                        }
                    }
                    item.approvalSchemes = approvalSchemes.substring(0, approvalSchemes.length-1);

                    if (isEmpty(item.accessRequestConfig.commentsRequired)) {
                        item.accessRequestConfig.commentsRequired = false;
                    }

                    if (isEmpty(item.accessRequestConfig.denialCommentsRequired)) {
                        item.accessRequestConfig.denialCommentsRequired = false;
                    }
                }

                if (item.revocationRequestConfig) {
                    let approvalSchemes = '';
                    for (let index = 0; index < item.revocationRequestConfig.approvalSchemes.length; index++){
                        const scheme = item.revocationRequestConfig.approvalSchemes[index];
                        
                        if (scheme.approverType === 'GOVERNANCE_GROUP') {
                            let governanceGroupName = '';
                            if (governanceGroups !== undefined && governanceGroups instanceof Array) {
                                for (let group of governanceGroups) {
                                    if (group.id.trim() === scheme.approverId.trim()) {
                                        governanceGroupName =  group.name;
                                    }
                                }
                            }
                            
                            if (!isEmpty(governanceGroupName)) {
                                approvalSchemes += governanceGroupName  + ';';
                            }
                        } else {
                            approvalSchemes += scheme.approverType  + ';';
                        }
                    }
                    item.revokeApprovalSchemes = approvalSchemes.substring(0, approvalSchemes.length-1);

                    if (isEmpty(item.revocationRequestConfig.commentsRequired)) {
                        item.revocationRequestConfig.commentsRequired = false;
                    }

                    if (isEmpty(item.revocationRequestConfig.denialCommentsRequired)) {
                        item.revocationRequestConfig.denialCommentsRequired = false;
                    }
                }
                return item;
            }
        ];

        const iterator = new RolePaginator(this.client);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token, customTransform);
    }
}