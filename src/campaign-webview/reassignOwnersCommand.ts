import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { confirm } from '../utils/vsCodeHelpers';
import { AccessReviewItem, CampaignStatusEnum, DtoType, ReassignReference, ReassignReferenceTypeEnum } from 'sailpoint-api-client';

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

        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)

        try {
            // Ensure the campaign is not completed
            const campaign = await client.getCampaign(campaignId);
            if (campaign.status === CampaignStatusEnum.Completed) {
                console.log(`< ReassignOwnersCommand.execute: Campaign ${campaignId} is completed. Exiting script.`);
                return;
            }

            // Get all pending campaign certifications (which would be 1:1 with reviewers)
            const pendingCertifications = await client.getCampaignCertifications(campaignId, false)
            if (!pendingCertifications) {
                console.log(`< ReassignOwnersCommand.execute: No pending certifications found for Campaign ID: ${campaignId}`);
                return;
            }

            // Reassign Review Items API can only be called per Certification
            for (const pendingCertification of pendingCertifications) {

                // Build campaign reassignments map (based on the access item owner)
                let campaignReassignments = new Map<string, ReassignReference[]>()
                const pendingReviewItems = await client.getCertificationReviewItems(pendingCertification.id, false)

                for (const pendingReviewItem of pendingReviewItems) {
                    let reviewerId = await this.getAccessItemOwner(client, pendingReviewItem)
                    // There should always be an owner but checking to be sure
                    if (reviewerId && reviewerId !== pendingCertification.reviewer?.id) {
                        let ownerReviewItems = campaignReassignments.get(reviewerId)
                        if (!ownerReviewItems) {
                            ownerReviewItems = []
                        }
                        ownerReviewItems.push({ id: pendingReviewItem.id, type: ReassignReferenceTypeEnum.Item })
                        campaignReassignments.set(reviewerId, ownerReviewItems)
                    }
                }

                // Process reassignments for this Certification
                await client.processCampaignReviewItemReassignments(pendingCertification.id, campaignReassignments, "Reassigning to the Access Item Owner")
            }
            console.log(`< ReassignOwnersCommand.execute: Finished reassigning access review items to the access owners for campaign ${campaignId}`);
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : error.toString();
            console.log(`< ReassignOwnersCommand.execute: Error processing campaign with ID ${campaignId}: ${errorMessage}`);
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
                const source = await client.getSourceById(pendingReviewItem.accessSummary?.entitlement?.sourceId)
                return source.owner.id
            default:
                return
        }
    }

}
