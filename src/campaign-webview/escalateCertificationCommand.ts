import * as vscode from 'vscode';

import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';
import { CampaignStatusEnum } from 'sailpoint-api-client';
import { confirm } from '../utils/vsCodeHelpers';

/**
 * Command used to open the campaign panel
 */
export class EscalateCertificationCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> EscalateCertificationCommand.execute", node);

        if (!(await confirm(`Are you sure you want to escalate all pending certifications to the reviewer managers for the campaign ${node.label}?`))) {
            console.log("< EscalateCertificationCommand.execute: no reassignment");
            return
        }

        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)

        try {
            // Ensure the campaign is not completed
            const campaign = await client.getCampaign(campaignId);
            if (campaign.status === CampaignStatusEnum.Completed) {
                console.log(`< EscalateCertificationCommand.execute: Campaign ${campaignId} is completed. Exiting script.`);
                return;
            }

            // Get all pending campaign certifications (which would be 1:1 with reviewers)
            const pendingCertifications = await client.getCampaignCertifications(campaignId, false)
            if (!pendingCertifications) {
                console.log(`< EscalateCertificationCommand.execute: No pending certifications found for Campaign ID: ${campaignId}`);
                return;
            }

            // Build campaign reassignments map (based on the current reviewer's manager)
            const campaignReassignments = new Map<string, string[]>();
            for (const pendingCertification of pendingCertifications) {
                const reviewerId = pendingCertification.reviewer.id;
                if (reviewerId) {
                    const reviewerData = await client.getPublicIdentityById(reviewerId);
                    const reviewerManagerId = reviewerData.manager?.id
                    if (reviewerManagerId && reviewerManagerId !== pendingCertification.reviewer?.id) {
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
            console.log(`< EscalateCertificationCommand.execute: Error processing campaign with ID ${campaignId}: ${errorMessage}`);
        }
    }
}