import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { RolesTreeItem } from '../../models/IdentityNowTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import RolePaginator from './RolePaginator';
import { isEmpty } from 'lodash';
import { AccessProfileRef, OwnerReference, RequestabilityForRole, Revocability, Role } from 'sailpoint-api-client';
import { GovernanceGroupCacheService } from '../../services/cache/GovernanceGroupCacheService';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { accessProfileApprovalSchemeConverter } from '../../utils/approvalSchemeConverter';

export class RoleExporterCommand {
    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node?: RolesTreeItem) {
        console.log("> RoleExporterCommand.execute");

        if (node === undefined) {
            console.error("WARNING: RoleExporterCommand: invalid item", node);
            throw new Error("RoleExporterCommand: invalid item");
        }

        const proposedPath = PathProposer.getRoleReportFilename(
            node.tenantName,
            node.tenantDisplayName
        );

        const filePath = await askFile(
            "Enter the file to save the CSV for role export",
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

/**
 * A Role as exported
 * @interface RoleDto
 */
export interface RoleDto {
    /**
     * The human-readable display name of the Role
     * @type {string}
     * @memberof Role
     */
    'name': string;

    /**
     * A human-readable description of the Role
     * @type {string}
     * @memberof Role
     */
    'description'?: string;
    /**
     *
     * @type {OwnerReference}
     * @memberof Role
     */
    'owner': OwnerReference | null;
    /**
     *
     * @type {Array<AccessProfileRef>}
     * @memberof Role
     */
    'accessProfiles'?: string;
    /**
     *
     * @type {RoleMembershipSelector}
     * @memberof Role
     */
    //'membership'?: RoleMembershipSelector | null;
    /**

    /**
     * Whether the Role is enabled or not.
     * @type {boolean}
     * @memberof Role
     */
    'enabled'?: boolean;
    /**
     * Whether the Role can be the target of access requests.
     * @type {boolean}
     * @memberof Role
     */
    'requestable'?: boolean;
    /**
     *
     * @type {RequestabilityForRole}
     * @memberof Role
     */
    'accessRequestConfig'?: RequestabilityForRole;
    /**
     *
     * @type {Revocability}
     * @memberof Role
     */
    'revocationRequestConfig'?: Revocability;

    /**
     * List describing the steps in approving the request
     */
    'approvalSchemes'?: string;

    /**
     * List describing the steps in approving the revocation request
     */
    'revokeApprovalSchemes'?: string;

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
            "requestable",
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
            "description",
            "enabled",
            "requestable",
            "owner.name",
            "accessRequestConfig.commentsRequired",
            "accessRequestConfig.denialCommentsRequired",
            "approvalSchemes",
            "revocationRequestConfig.commentsRequired",
            "revocationRequestConfig.denialCommentsRequired",
            "revokeApprovalSchemes",
            "accessProfiles"
        ];
        const unwindablePaths: string[] = [];

        const governanceGroupCache = new GovernanceGroupCacheService(this.client);


        const iterator = new RolePaginator(this.client);
        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: Role): Promise<RoleDto> => {
                const itemDto: RoleDto = {
                    name: item.name,
                    // Escape carriage returns in description.
                    description: item.description?.replaceAll('\r', "\\r").replaceAll('\n', "\\n"),
                    enabled: item.enabled,
                    requestable: item.requestable,
                    owner: {
                        name: item.owner.name
                    },
                    accessProfiles: item.accessProfiles?.map(x => x.name).join(CSV_MULTIVALUE_SEPARATOR),
                    accessRequestConfig: {
                        commentsRequired: item.accessRequestConfig?.commentsRequired ?? false,
                        denialCommentsRequired: item.accessRequestConfig?.denialCommentsRequired ?? false,
                    },
                    revocationRequestConfig: {
                        commentsRequired: item.revocationRequestConfig?.commentsRequired ?? false,
                        denialCommentsRequired: item.revocationRequestConfig?.denialCommentsRequired ?? false
                    },
                    approvalSchemes: await accessProfileApprovalSchemeConverter(
                        item.accessRequestConfig?.approvalSchemes,
                        governanceGroupCache),
                    revokeApprovalSchemes: await accessProfileApprovalSchemeConverter(
                        item.revocationRequestConfig?.approvalSchemes,
                        governanceGroupCache)
                };

                return itemDto;
            });
        console.log("Governance Group Cache stats", governanceGroupCache.getStats());
        governanceGroupCache.flushAll();
    }
}