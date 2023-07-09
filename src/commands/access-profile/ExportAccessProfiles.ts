import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { AccessProfile } from '../../models/AccessProfile';
import AccessProfilePaginator from './AccessProfilePaginator';
import { AccessProfilesTreeItem } from '../../models/IdentityNowTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { isEmpty } from 'lodash';

export class AccessProfileExporterCommand {
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: AccessProfilesTreeItem) {
        console.log("> AccessProfileExporterCommand.execute");

        if (node === undefined) {
            console.error("WARNING: AccessProfileExporterCommand: invalid item", node);
            throw new Error("AccessProfileExporterCommand: invalid item");
        }

        const proposedPath = PathProposer.getGenericCSVFilename(
            node.tenantName,
            node.tenantDisplayName,
            "AccessProfile"
        );

        const filePath = await askFile(
            "Enter the file to save the account report to",
            proposedPath
        );

        if (filePath === undefined) {
            return;
        }

        const exporter = new AccessProfileExporter(
            node.tenantId,
            node.tenantName,
            node.tenantDisplayName,
            filePath
        );
        await exporter.exportFileWithProgression();
    }
}

class AccessProfileExporter extends BaseCSVExporter<AccessProfile> {
    constructor(
        tenantId: string,
        tenantName: string,
        tenantDisplayName: string,
        path: string
    ) {
        super("access profiles",
            tenantId,
            tenantName,
            tenantDisplayName,
            '', // Base exported forces sourceId, but we do not need to use it in here, so leaving it blank.
            path);
    }

    protected async exportFile(task: any, token: vscode.CancellationToken): Promise<void> {
        console.log("> AccessProfileExporter.exportFile");
        const headers = [
            "name", 
            "description", 
            "enabled", 
            "source", 
            "owner", 
            "commentsRequired", 
            "denialCommentsRequired", 
            "approvalSchemes", 
            "revokeCommentsRequired", 
            "revokeDenialCommentsRequired", 
            "revokeApprovalSchemes", 
            "entitlements"
        ];
        const paths = [
            "name", 
            "description", 
            "enabled", 
            "source.name", 
            "owner.name", 
            "accessRequestConfig.commentsRequired", 
            "accessRequestConfig.denialCommentsRequired", 
            "approvalSchemes",
            "revocationRequestConfig.commentsRequired", 
            "revocationRequestConfig.denialCommentsRequired", 
            "revokeApprovalSchemes", 
            "entitlements"
        ];
        const unwindablePaths: string[] = [];

        const governanceGroups = await this.client.getGovernanceGroups();

        const customTransform: any[] | undefined = [
            function(item:any) {
                let entitlements = '';
                
                for (let index = 0; index < item.entitlements.length; index++){
                    const ent = item.entitlements[index];
                    entitlements += ent.name + ';';
                }
                item.entitlements = entitlements.substring(0, entitlements.length-1);

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

                // Escape carriage returns in description.
                if (item.description) {
                    item.description = item.description.replaceAll('\r\n', '\\r\\n').replaceAll('\r', '\\r').replaceAll('\n', '\\n');
                }
                return item;
            }
        ];

        const iterator = new AccessProfilePaginator(this.client);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token, customTransform);
    }
}