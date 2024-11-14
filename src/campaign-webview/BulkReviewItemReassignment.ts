import * as vscode from 'vscode';

import { CampaignStatusEnum, CertificationsApiSubmitReassignCertsAsyncRequest, IdentityCertificationDto, ReassignReference } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

const REVIEW_ITEM_REASSIGN_LIMIT = 500

export class BulkReviewItemReassignment {
    constructor(private readonly client: ISCClient) { }

    async execute(pendingCertification: IdentityCertificationDto, campaignReassignments: Map<string, ReassignReference[]>, comment: string) {

        let nbRreassignment = 0

        // Process campaign reassignments
        // Using a for-loop instead of forEach + async code to prevent hammering API resulting in 429
        for (const [reviewerId, allReassignReferences] of campaignReassignments.entries()) {
            await this.processReviewItemReassignments(pendingCertification.id, reviewerId, allReassignReferences, comment)
            nbRreassignment += allReassignReferences.length
        }

        vscode.window.showInformationMessage(`${nbRreassignment} review item(s) reassigned for ${pendingCertification.campaign?.name}.`)

    }

    public async processReviewItemReassignments(certificationId: string, reviewerId: string, allReassignReferences: ReassignReference[], reassignReason: string) {
        while (allReassignReferences.length > 0) {
            // Split the reassign references to not exceed the API limit
            const reassignReferences = allReassignReferences.splice(0, REVIEW_ITEM_REASSIGN_LIMIT);
            const certificationReassignRequest: CertificationsApiSubmitReassignCertsAsyncRequest = {
                id: certificationId,
                reviewReassign: {
                    reassign: reassignReferences,
                    reassignTo: reviewerId,
                    reason: reassignReason
                }
            }
            await this.client.reassignCertificationReviewItems(certificationReassignRequest)
        }
    }

    async getPendingCampaignItems(campaignId: string): Promise<IdentityCertificationDto[] | undefined> {
        // Ensure the campaign is not completed
        const campaign = await this.client.getCampaign(campaignId);
        if (campaign.status === CampaignStatusEnum.Completed) {
            console.log(`< BulkReviewItemReassignment.execute: Campaign ${campaignId} is completed. Exiting script.`);
            return;
        }

        // Get all pending campaign certifications (which would be 1:1 with reviewers)
        const pendingCertifications = await this.client.getCampaignCertifications(campaignId, false)
        if (!pendingCertifications) {
            console.log(`< BulkReviewItemReassignment.execute: No pending certifications found for Campaign ID: ${campaignId}`);
            return;
        }
        return pendingCertifications
    }
}