import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { confirm } from '../utils/vsCodeHelpers';
import { AccessReviewItem, DtoType, ReassignReference, ReassignReferenceTypeV3 } from 'sailpoint-api-client';
import { BulkReviewItemReassignment } from './BulkReviewItemReassignment';

const OWNER_REVIEW_DEFAULT_COMMENT = "Reassigned to the Access Item Owner"

/**
 * Command used to open the campaign panel
 */
export class ReassignOwnersCommand {
    constructor(private tenantService: TenantService,
        private campaignService: CampaignConfigurationService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> ReassignOwnersCommand.execute", node);

        if (!(await confirm(`Are you sure you want to reassign access item reviews to the access item owners for the campaign ${node.label}?`))) {
            console.log("< ReassignOwnersCommand.execute: no reassignment");
            return
        }

        const campaignId = node.id as string
        const client = new ISCClient(node.tenantId, node.tenantName)

        try {
            const bulkReviewItemReassigner = new BulkReviewItemReassignment(client)
            const pendingCertifications = await bulkReviewItemReassigner.getPendingCampaignItems(campaignId)

            if (!pendingCertifications) {
                vscode.window.showErrorMessage(`No pending certification found for ${node.label}.`)
                return
            }

            // Reassign Review Items API can only be called per Certification
            for (const pendingCertification of pendingCertifications) {

                // Build campaign reassignments map (based on the access item owner)
                let campaignReassignments = new Map<string, ReassignReference[]>()
                const pendingReviewItems = await client.getCertificationReviewItems(pendingCertification.id, false)

                for (const pendingReviewItem of pendingReviewItems) {
                    let reviewerId = await this.getAccessItemOwner(client, pendingReviewItem)
                    // There should always be an owner but checking to be sure
                    // Skip if owner is already the current reviewer
                    if (reviewerId && reviewerId !== pendingCertification.reviewer?.id) {
                        let ownerReviewItems = campaignReassignments.get(reviewerId)
                        if (!ownerReviewItems) {
                            ownerReviewItems = []
                        }
                        ownerReviewItems.push({ id: pendingReviewItem.id, type: ReassignReferenceTypeV3.Item })
                        campaignReassignments.set(reviewerId, ownerReviewItems)
                    }
                }

                // Process reassignments for this Certification
                await bulkReviewItemReassigner.execute(pendingCertification, campaignReassignments, OWNER_REVIEW_DEFAULT_COMMENT)
            }
            console.log(`< ReassignOwnersCommand.execute: Finished reassigning access review items to the access owners for campaign ${node.label}`);
            vscode.window.showInformationMessage(`Finished reassigning access review items to the access owners for campaign ${node.label}.`)
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : error.toString();
            console.log(`< ReassignOwnersCommand.execute: Error processing access owner reassignment for campaign ${node.label}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error processing access owner reassignment for campaign ${node.label}: ${errorMessage}`)
        }
    }

    async getAccessItemOwner(client: ISCClient, pendingReviewItem: AccessReviewItem): Promise<string | undefined> {
        // Get the Owner ID for Roles/Access Profiles
        // In case of Entitlements, find the Source Owner ID if the entitlement has no Owner
        switch (pendingReviewItem.accessSummary?.access?.type) {
            case DtoType.Role:
                return pendingReviewItem.accessSummary?.role?.owner?.id
            case DtoType.AccessProfile:
                return pendingReviewItem.accessSummary?.accessProfile?.owner?.id
            case DtoType.Entitlement:
                let entitlementOwnerId = pendingReviewItem.accessSummary?.entitlement?.owner?.id
                if (entitlementOwnerId) {
                    return entitlementOwnerId
                }
                let sourceId = pendingReviewItem.accessSummary?.entitlement?.sourceId
                // Skip entitlements from deleted sources with no source id
                if (sourceId) {
                    const source = await client.getSourceById(pendingReviewItem.accessSummary?.entitlement?.sourceId)
                    return source.owner.id
                }
                return
            default:
                return
        }
    }

}
