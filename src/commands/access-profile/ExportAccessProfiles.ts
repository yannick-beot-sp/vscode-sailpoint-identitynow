import * as vscode from 'vscode';
import { BaseCSVExporter } from "../BaseExporter";
import { AccessProfilesTreeItem } from '../../models/ISCTreeItem';
import { askFile } from '../../utils/vsCodeHelpers';
import { PathProposer } from '../../services/PathProposer';
import { AccessProfile, AccessProfileSourceRef, AccessProfilesApiListAccessProfilesRequest, Requestability } from 'sailpoint-api-client';
import { GenericAsyncIterableIterator } from '../../utils/GenericAsyncIterableIterator';
import { GovernanceGroupIdToNameCacheService } from '../../services/cache/GovernanceGroupIdToNameCacheService';
import { WorkflowIdToNameCacheService } from '../../services/cache/WorkflowIdToNameCacheService';
import { accessProfileApprovalSchemeToStringConverter } from '../../utils/approvalSchemeConverter';
import { IdentityIdToNameCacheService } from '../../services/cache/IdentityIdToNameCacheService';
import { metadataToString } from '../../utils/metadataUtils';
import { EntitlementIdToSourceNameCacheService } from '../../services/cache/EntitlementIdToSourceNameCacheService';
import { entitlementToStringConverter } from '../../utils/entitlementToStringConverter';
import { CSV_MULTIVALUE_SEPARATOR } from '../../constants';

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

        const proposedPath = PathProposer.getAccessProfileReportFilename(
            node.tenantName,
            node.tenantDisplayName
        );

        const filePath = await askFile(
            "Enter the file to save the CSV for access profile export",
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
interface AccessProfileDto {
    /**
     * Name of the Access Profile
     * @type {string}
     */
    'name': string;
    /**
     * Information about the Access Profile
     * @type {string}
     */
    'description'?: string;

    /**
     * Whether the Access Profile is enabled. If the Access Profile is enabled then you must include at least one Entitlement.
     * @type {boolean}
     */
    'enabled'?: boolean;
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
     * @type {AccessProfileSourceRef}
     */
    'source': AccessProfileSourceRef;

    /**
     * List describing the steps in approving the request
     */
    'approvalSchemes'?: string;

    /**
     * List describing the steps in approving the revocation request
     */
    'revokeApprovalSchemes'?: string;
    /**
     * A list of entitlements associated with the Access Profile. If enabled is false this is allowed to be empty otherwise it needs to contain at least one Entitlement.
     */
    'entitlements'?: string;
    /**
     * Whether the Access Profile is requestable via access request. Currently, making an Access Profile non-requestable is only supported  for customers enabled with the new Request Center. Otherwise, attempting to create an Access Profile with a value  **false** in this field results in a 400 error.
     * @type {boolean}
     */
    'requestable'?: boolean;
    /**
     *
     * @type {Requestability}
     */
    'accessRequestConfig'?: Requestability;
    /**
     * A list of metadata associated with the Access Profile. metadata are seperated by ";". 
     * The expected format is key:value1,value2;key2:value3
     */
    metadata?: string;
}

type AdditionalOwnerRef = { type?: string; id?: string; name?: string };

async function formatAdditionalOwners(
    additionalOwners: AdditionalOwnerRef[] | undefined,
    identityCacheIdToName: IdentityIdToNameCacheService,
    governanceGroupCacheIdToName: GovernanceGroupIdToNameCacheService
): Promise<{ additionalOwners: string | null; additionalOwnerGovernanceGroup: string | null }> {
    if (!additionalOwners || additionalOwners.length === 0) {
        return { additionalOwners: null, additionalOwnerGovernanceGroup: null };
    }

    const governanceGroupOwner = additionalOwners.find((owner) => owner.type === "GOVERNANCE_GROUP");
    if (governanceGroupOwner?.id) {
        const governanceGroupName = governanceGroupOwner.name
            ?? await governanceGroupCacheIdToName.get(governanceGroupOwner.id);
        return { additionalOwners: null, additionalOwnerGovernanceGroup: governanceGroupName };
    }

    const identityNames = await Promise.all(additionalOwners.map(async (owner) => {
        if (owner.name) {
            return owner.name;
        }
        if (owner.id) {
            return identityCacheIdToName.get(owner.id);
        }
        return null;
    }));

    const filteredNames = identityNames.filter((name): name is string => !!name);
    return {
        additionalOwners: filteredNames.length ? filteredNames.join(CSV_MULTIVALUE_SEPARATOR) : null,
        additionalOwnerGovernanceGroup: null
    };
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
            "requestable",
            "source",
            "owner",
            "additionalOwners",
            "additionalOwnerGovernanceGroup",
            "commentsRequired",
            "denialCommentsRequired",
            "approvalSchemes",
            "revokeApprovalSchemes",
            "entitlements",
            "metadata"
        ];
        const paths = [
            "name",
            "description",
            "enabled",
            "requestable",
            "source.name",
            "owner",
            "additionalOwners",
            "additionalOwnerGovernanceGroup",
            "accessRequestConfig.commentsRequired",
            "accessRequestConfig.denialCommentsRequired",
            "approvalSchemes",
            "revokeApprovalSchemes",
            "entitlements",
            "metadata"
        ];
        const unwindablePaths: string[] = [];

        const governanceGroupCache = new GovernanceGroupIdToNameCacheService(this.client);
        const workflowCache = new WorkflowIdToNameCacheService(this.client);
        await workflowCache.init();
        const identityCacheIdToName = new IdentityIdToNameCacheService(this.client);
        const entitlementIdToSourceNameCacheService = new EntitlementIdToSourceNameCacheService(this.client);

        const iterator = new GenericAsyncIterableIterator<AccessProfile, AccessProfilesApiListAccessProfilesRequest>(
            this.client,
            this.client.getAccessProfiles);

        await this.writeData(headers, paths, unwindablePaths, iterator, task, token,
            async (item: AccessProfile): Promise<AccessProfileDto> => {
                const owner = item.owner ? (await identityCacheIdToName.get(item.owner.id!)) : null
                const additionalOwnersInfo = await formatAdditionalOwners(
                    (item as any).additionalOwners,
                    identityCacheIdToName,
                    governanceGroupCache
                );

                let entitlements: string | undefined = undefined;
                try {
                    entitlements = (item.entitlements ? (await entitlementToStringConverter(item.entitlements, entitlementIdToSourceNameCacheService)) : null);
                } catch (error) {
                    console.warn(`Error converting entitlements for role "${item.name}:"`, error);
                }


                const itemDto: AccessProfileDto = {
                    name: item.name,
                    // Escape carriage returns in description.
                    description: item.description,
                    enabled: item.enabled,
                    requestable: item.requestable,
                    source: {
                        name: item.source.name
                    },
                    owner: owner,
                    additionalOwners: additionalOwnersInfo.additionalOwners,
                    additionalOwnerGovernanceGroup: additionalOwnersInfo.additionalOwnerGovernanceGroup,
                    entitlements,
                    accessRequestConfig: {
                        commentsRequired: item.accessRequestConfig?.commentsRequired ?? false,
                        denialCommentsRequired: item.accessRequestConfig?.denialCommentsRequired ?? false,
                    },
                    approvalSchemes: await accessProfileApprovalSchemeToStringConverter(
                        item.accessRequestConfig?.approvalSchemes,
                        governanceGroupCache,
                        workflowCache),
                    revokeApprovalSchemes: await accessProfileApprovalSchemeToStringConverter(
                        item.revocationRequestConfig?.approvalSchemes,
                        governanceGroupCache,
                        workflowCache),
                    // @ts-ignore Waiting for client SDK to be updated
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
        console.log("Entitlement Cache stats", entitlementIdToSourceNameCacheService.getStats());
        entitlementIdToSourceNameCacheService.flushAll();
    }
}

