import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';
import { confirm } from '../utils/vsCodeHelpers';
import { AccessReviewItem, DtoType } from 'sailpoint-api-client';
import { BulkReviewItemReassignment } from './BulkReviewItemReassignment';
import { TenantService } from '../services/TenantService';
import { isTenantReadonly, validateTenantReadonly } from '../commands/validateTenantReadonly';
import { SourceIdToOwnerIdCacheService } from '../services/cache/SourceIdToOwnerIdCacheService';

const OWNER_REVIEW_DEFAULT_COMMENT = "Reassigned to the Access Item Owner"

/**
 * Command used to reassigned acccess review items to access owners
 */
export class ReassignOwnersCommand {
    constructor(private tenantService: TenantService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> ReassignOwnersCommand.execute", node);

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)

        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `reassign access item reviews to the access item owners for the campaign ${node.label}?`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to reassign access item reviews to the access item owners for the campaign ${node.label}?`)))) {
            console.log("< CustomReassignCommand.execute: no reassignment");
            return
        }

        const campaignId = node.id as string
        const client = new ISCClient(node.tenantId, node.tenantName)
        const sourceOwnerCacheService = new SourceIdToOwnerIdCacheService(client)

        const bulkReviewItemReassigner = new BulkReviewItemReassignment(client)
        const report = await bulkReviewItemReassigner.reassignCampaign(
            campaignId,
            `Reassigning items of ${node.label} to access owner`,
            node.label,
            OWNER_REVIEW_DEFAULT_COMMENT,
            `Successfully reassigned items for campaign ${node.label} to access owners.`,
            async (pendingReviewItem: AccessReviewItem) => {
                return await this.getAccessItemOwner(client, sourceOwnerCacheService, pendingReviewItem)
            }
        )

        sourceOwnerCacheService.flushAll();
        console.log(`< ReassignOwnersCommand.execute: Finished reassigning access review items to the access owners for campaign ${node.label}`, report);
    }

    async getAccessItemOwner(client: ISCClient, sourceOwnerCacheService: SourceIdToOwnerIdCacheService, pendingReviewItem: AccessReviewItem): Promise<string | undefined> {
        // Get the Owner ID for Roles/Access Profiles
        // In case of Entitlements, find the Source Owner ID if the entitlement has no Owner
        switch (pendingReviewItem.accessSummary?.access?.type) {
            case DtoType.Role:
                return pendingReviewItem.accessSummary?.role?.owner?.id
            case DtoType.AccessProfile:
                return pendingReviewItem.accessSummary?.accessProfile?.owner?.id
            case DtoType.Entitlement:
                const entitlementOwnerId = pendingReviewItem.accessSummary?.entitlement?.owner?.id
                if (entitlementOwnerId) {
                    return entitlementOwnerId
                }
                const sourceId = pendingReviewItem.accessSummary?.entitlement?.sourceId
                // Skip entitlements from deleted sources with no source id
                if (sourceId) {
                    return await sourceOwnerCacheService.get(sourceId)
                }
        }
        return undefined
    }

}
