import * as vscode from 'vscode';

import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';
import { CampaignStatusEnum } from 'sailpoint-api-client';

/**
 * Command used to open the campaign panel
 */
export class EscalateCertificationCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> EscalateCertificationCommand.execute", node);

        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        try {
            // Ensure the campaign is not completed
            const campaign = await client.getCampaign(campaignId);
            if (campaign.status === CampaignStatusEnum.Completed) {
                console.log(`Campaign ${campaignId} is completed. Exiting script.`);
                return;
            }

            // Get all pending campaign certifications (which would be 1:1 with reviewers)
            const pendingCertifications = await client.getCampaignCertificationsByFilter(`campaign.id eq "${campaignId}" and completed eq false`)
            if (!pendingCertifications) {
                console.log(`No pending certifications found for Campaign ID: ${campaignId}`);
                return;
            }

            // Build campaign reassignments map (currently based on the current reviewer's manager)
            const campaignReassignments = new Map<string, string[]>();
            for (const pendingCertification of pendingCertifications) {
                const reviewerId = pendingCertification.reviewer.id;
                if (reviewerId) {
                    const reviewerData = await client.getPublicIdentityById(reviewerId);
                    const reviewerManagerId = reviewerData.manager?.id
                    if (reviewerManagerId) {
                        let managerCertifications = campaignReassignments.get(reviewerManagerId)
                        if (!managerCertifications) {
                            managerCertifications = [];
                        }
                        managerCertifications.push(pendingCertification.id)
                        campaignReassignments.set(reviewerManagerId, managerCertifications)
                    }
                }
            }

            // Process campaign reassignments
            await client.processCampaignReviewerReassignments(campaignId, campaignReassignments, "Escalating to the Reviewer's Manager")
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : error.toString();
            console.log(`Error processing campaign with ID ${campaignId}: ${errorMessage}`);
        }
    }
}