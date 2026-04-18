import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { RolesTreeItem } from '../../models/ISCTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { RequestabilityForRole, RevocabilityForRole, RoleMembershipSelectorType, RolesApiListRolesRequest, RoleV2025 } from 'sailpoint-api-client';
import { GovernanceGroupIdToNameCacheService } from '../../services/cache/GovernanceGroupIdToNameCacheService';
import { WorkflowIdToNameCacheService } from '../../services/cache/WorkflowIdToNameCacheService';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';
import { approvalSchemeToStringConverter } from '../../utils/approvalSchemeConverter';
import { IdentityIdToNameCacheService } from '../../services/cache/IdentityIdToNameCacheService';
import { roleMembershipSelectorToStringConverter } from '../../parser/roleMembershipSelectorToStringConverter';
import { SourceIdToNameCacheService } from '../../services/cache/SourceIdToNameCacheService';
import { GenericAsyncIterableIterator } from '../../utils/GenericAsyncIterableIterator';
import { EntitlementIdToSourceNameCacheService } from '../../services/cache/EntitlementIdToSourceNameCacheService';
import { metadataToString } from '../../utils/metadataUtils';
import { dimensionSchemaToString } from '../../utils/dimensionUtils';
import { entitlementToStringConverter } from '../../utils/entitlementToStringConverter';
import { getAdditionalOwners } from '../../utils/additionalOwners';

export class RoleExporterCommand {

    /**
     * Entry point 
     * @param node 
     * @returns 
     */
    async execute(node: RolesTreeItem) {
        console.log("> RoleExporterCommand.execute");

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
    'description'?: string | null;
    /**
     *
     * @type {string}
     * @memberof Role
     */
    'owner': string | null;
    'additionalOwners'?: string | null;
    'additionalOwnerGovernanceGroup'?: string | null;
    /**
     *
     * @type {Array<AccessProfileRef>}
     * @memberof Role
     */
    'accessProfiles'?: string | null;
    'entitlements'?: string | null;
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
    'revocationRequestConfig'?: RevocabilityForRole;

    /**
     * List describing the steps in approving the request
     */
    'approvalSchemes'?: string;

    /**
     * List describing the steps in approving the revocation request
     */
    'revokeApprovalSchemes'?: string;

    /**
     * String representation of the membership criteria
     */
    membershipCriteria?: string;

    dimensional?: boolean | null
    dimensionAttributes?: string
    /**
     * A list of metadata associated with the Role. metadata are seperated by ";". 
     * The expected format is key:value1,value2;key2:value3
     */
    metadata?: string;


}

class RoleExporter extends BaseCSVExporter<RoleV2025> {
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
            "additionalOwners",
            "additionalOwnerGovernanceGroup",
            "commentsRequired",
            "denialCommentsRequired",
            "approvalSchemes",
            "reauthorizationRequired",
            "requireEndDate",
            "maxPermittedAccessDurationValue",
            "maxPermittedAccessDurationTimeUnit",
            "revokeCommentsRequired",
            "revokeDenialCommentsRequired",
            "revokeApprovalSchemes",
            "accessProfiles",
            "entitlements",
            "membershipCriteria",
            "dimensional",
            "dimensionAttributes",
            "metadata"
        ];
        const paths = [
            "name",
            "description",
            "enabled",
            "requestable",
            "owner",
            "additionalOwners",
            "additionalOwnerGovernanceGroup",
            "accessRequestConfig.commentsRequired",
            "accessRequestConfig.denialCommentsRequired",
            "approvalSchemes",
            "accessRequestConfig.reauthorizationRequired",
            "accessRequestConfig.requireEndDate",
            "accessRequestConfig.maxPermittedAccessDuration.value",
            "accessRequestConfig.maxPermittedAccessDuration.timeUnit",
            "revocationRequestConfig.commentsRequired",
            "revocationRequestConfig.denialCommentsRequired",
            "revokeApprovalSchemes",
            "accessProfiles",
            "entitlements",
            "membershipCriteria",
            "dimensional",
            "dimensionAttributes",
            "metadata"
        ];
        const unwindablePaths: string[] = [];

        const governanceGroupCache = new GovernanceGroupIdToNameCacheService(this.client);
        const workflowCache = new WorkflowIdToNameCacheService(this.client);
        await workflowCache.init()
        const identityCacheIdToName = new IdentityIdToNameCacheService(this.client);
        const sourceIdToNameCacheService = new SourceIdToNameCacheService(this.client);
        const entitlementIdToSourceNameCacheService = new EntitlementIdToSourceNameCacheService(this.client);

        const iterator = new GenericAsyncIterableIterator<RoleV2025, RolesApiListRolesRequest>(
            this.client,
            this.client.getRoles);

        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: RoleV2025): Promise<RoleDto> => {
                let membershipCriteria: string | undefined = undefined;
                if (item.membership !== undefined && item.membership !== null
                    && RoleMembershipSelectorType.Standard === item.membership.type
                ) {
                    try {
                        membershipCriteria = await roleMembershipSelectorToStringConverter(
                            item.membership.criteria, sourceIdToNameCacheService);
                    } catch (error) {
                        console.warn(`Error converting membership criteria for role "${item.name}:"`, error);
                    }
                }
                let owner: string | null = null;
                try {
                    owner = item.owner ? (await identityCacheIdToName.get(item.owner.id!)) : null
                } catch (error) {
                    console.warn(`Error converting owner identity "${item.owner?.id}" for role "${item.name}":`, error);
                }

                const additionalOwnersInfo = await getAdditionalOwners(
                    item.additionalOwners,
                    identityCacheIdToName,
                    governanceGroupCache
                );

                let entitlements: string | undefined | null = null;
                try {
                    entitlements = (item.entitlements ? (await entitlementToStringConverter(item.entitlements, entitlementIdToSourceNameCacheService)) : null);
                } catch (error) {
                    console.warn(`Error converting entitlements for role "${item.name}:"`, error);
                }

                const itemDto: RoleDto = {
                    name: item.name,
                    // Escape carriage returns in description.
                    description: item.description,
                    enabled: item.enabled,
                    requestable: item.requestable,
                    owner: owner,
                    additionalOwners: additionalOwnersInfo.additionalOwners,
                    additionalOwnerGovernanceGroup: additionalOwnersInfo.additionalOwnerGovernanceGroup,
                    accessProfiles: item.accessProfiles?.map(x => x.name).join(CSV_MULTIVALUE_SEPARATOR),
                    entitlements,
                    accessRequestConfig: {
                        commentsRequired: item.accessRequestConfig?.commentsRequired ?? false,
                        denialCommentsRequired: item.accessRequestConfig?.denialCommentsRequired ?? false,
                        reauthorizationRequired: item.accessRequestConfig?.reauthorizationRequired ?? false,
                        requireEndDate: item.accessRequestConfig?.requireEndDate ?? false,
                        maxPermittedAccessDuration: item.accessRequestConfig?.maxPermittedAccessDuration

                    },
                    revocationRequestConfig: {
                        commentsRequired: item.revocationRequestConfig?.commentsRequired ?? false,
                        denialCommentsRequired: item.revocationRequestConfig?.denialCommentsRequired ?? false
                    },
                    approvalSchemes: await approvalSchemeToStringConverter(
                        item.accessRequestConfig?.approvalSchemes,
                        governanceGroupCache,
                        workflowCache),
                    revokeApprovalSchemes: await approvalSchemeToStringConverter(
                        item.revocationRequestConfig?.approvalSchemes,
                        governanceGroupCache,
                        workflowCache),
                    membershipCriteria,
                    dimensional: item.dimensional,
                    dimensionAttributes: dimensionSchemaToString(item.accessRequestConfig?.dimensionSchema),
                    metadata: metadataToString(item.accessModelMetadata)
                };

                return itemDto;
            });
        console.log("Governance Group Cache stats", governanceGroupCache.getStats());
        governanceGroupCache.flushAll();
        console.log("Workflow Cache stats", workflowCache.getStats());
        workflowCache.flushAll();
        console.log("Identity Cache stats", identityCacheIdToName.getStats());
        identityCacheIdToName.flushAll();
        console.log("Source Cache stats", sourceIdToNameCacheService.getStats());
        sourceIdToNameCacheService.flushAll();
        console.log("Entitlement Cache stats", entitlementIdToSourceNameCacheService.getStats());
        entitlementIdToSourceNameCacheService.flushAll();
    }
}

