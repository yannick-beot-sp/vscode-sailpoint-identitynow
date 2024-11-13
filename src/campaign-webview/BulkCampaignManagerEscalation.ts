import * as vscode from 'vscode';

import { AdminReviewReassignReassignTo, AdminReviewReassignReassignToTypeEnum, CampaignStatusEnum, CertificationCampaignsApiMoveRequest } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

const CERTIFICATIONS_REASSIGN_LIMIT = 250;
const COMMENT = "Escalating to the Reviewer's Manager"

export class BulkCampaignManagerEscalation {
    constructor(private readonly client: ISCClient) { }

    async execute(campaignId: string) {
        const campaign = await this.client.getCampaign(campaignId);

        // Ensure the campaign is not completed
        if (campaign.status === CampaignStatusEnum.Completed) {
            console.log(`< EscalateCertificationCommand.execute: Campaign ${campaignId} is completed. Exiting script.`);
            vscode.window.showWarningMessage(`Campaign ${campaign.name} is already completed. Cannot reassign certifications.`)
            return;
        }

        // Get all pending campaign certifications (which would be 1:1 with reviewers)
        const pendingCertifications = await this.client.getCampaignCertifications(campaignId, false)
        if (!pendingCertifications) {
            console.log(`< EscalateCertificationCommand.execute: No pending certifications found for Campaign ID: ${campaignId}`);
            vscode.window.showWarningMessage(`No pending certifications found for campaign ${campaign.name}.`)
            return;
        }

        let nbRreassignment = 0
        // Build campaign reassignments map (based on the current reviewer's manager)
        const campaignReassignments = new Map<string, string[]>();
        for (const pendingCertification of pendingCertifications) {
            const reviewerId = pendingCertification.reviewer.id;
            if (reviewerId) {
                const reviewerData = await this.client.getPublicIdentityById(reviewerId);
                const reviewerManagerId = reviewerData.manager?.id
                if (reviewerManagerId) {
                    let managerCertifications = campaignReassignments.get(reviewerManagerId)
                    if (!managerCertifications) {
                        managerCertifications = [];
                    }
                    managerCertifications.push(pendingCertification.id)
                    campaignReassignments.set(reviewerManagerId, managerCertifications)
                    nbRreassignment++
                }
            }
        }

        // Process campaign reassignments
        // Using a for-loop instead of forEach + async code to prevent hammering API resulting in 429
        for (const [reviewerId, allCertificationIds] of campaignReassignments.entries()) {
            await this.processReviewerReassignments(campaignId, reviewerId, allCertificationIds, COMMENT)
        }

        vscode.window.showInformationMessage(`${nbRreassignment} certification(s) reassigned for ${campaign.name}.`)

    }


    private async processReviewerReassignments(campaignId: string, reviewerId: string, allCertificationIds: string[], reassignReason: string) {
        const newReviewer: AdminReviewReassignReassignTo = {
            id: reviewerId,
            type: AdminReviewReassignReassignToTypeEnum.Identity
        }

        while (allCertificationIds.length > 0) {
            // Split the reassign references to not exceed the API limit
            const certificationIds = allCertificationIds.splice(0, CERTIFICATIONS_REASSIGN_LIMIT);
            const certificationMoveRequest: CertificationCampaignsApiMoveRequest = {
                id: campaignId,
                adminReviewReassign: {
                    certificationIds: certificationIds,
                    reassignTo: newReviewer,
                    reason: reassignReason
                }
            }
            await this.client.reassignCampaignCertifications(certificationMoveRequest)
        }
    }
}