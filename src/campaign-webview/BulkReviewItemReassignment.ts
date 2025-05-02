import * as vscode from 'vscode';

import { AccessReviewItem, CampaignStatusV3, CertificationsApiReassignIdentityCertificationsRequest, CertificationsApiSubmitReassignCertsAsyncRequest, IdentityCertificationDto, ReassignReference, ReassignReferenceTypeV3 } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

const ASYNC_REVIEW_ITEM_REASSIGN_LIMIT = 500
const SYNC_REVIEW_ITEM_REASSIGN_LIMIT = 50

interface ReassignmentReport {
    success: number
    error: number
    skip: number
    selfassignment: number
    errorMessages: string[]
}

export async function getPendingCampaignItems(client: ISCClient, campaignId: string): Promise<IdentityCertificationDto[] | undefined> {
    // Ensure the campaign is not completed
    const campaign = await client.getCampaign(campaignId);
    if (campaign.status === CampaignStatusV3.Completed) {
        console.warn(`< BulkReviewItemReassignment.execute: Campaign ${campaignId} is completed. Exiting script.`);
        return;
    }

    // Get all pending campaign certifications (which would be 1:1 with reviewers)
    const pendingCertifications = await client.getCampaignCertifications(campaignId, false)
    if (!pendingCertifications) {
        console.warn(`< BulkReviewItemReassignment.execute: No pending certifications found for Campaign ID: ${campaignId}`);
        return;
    }
    return pendingCertifications
}

export class BulkReviewItemReassignment {
    constructor(private readonly client: ISCClient) { }

    /**
     * Will get all Certifications, go through all Access Review Item, and will try to reassign it
     * @param campaignId 
     * @param progressLabel label used for the progress
     */
    async reassignCampaign(campaignId: string,
        progressLabel: string,
        campaignName: string,
        reassignmentComment: string,
        successfulMessage: string,
        getAccessItemOwner: (pendingReviewItem: AccessReviewItem) => Promise<string | undefined>): Promise<void> {


        const reassignmentReport: ReassignmentReport = {
            success: 0,
            error: 0,
            skip: 0,
            selfassignment: 0,
            errorMessages: []
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: progressLabel,
            cancellable: true
        }, async (progress, token) => {

            const bulkReviewItemReassigner = new BulkReviewItemReassignment(this.client)

            progress.report({
                message: `Retrieving pending certifications ...`
            });
            const pendingCertifications = await getPendingCampaignItems(this.client, campaignId)

            if (!pendingCertifications) {
                vscode.window.showErrorMessage(`No pending certification found for ...`)
                return
            }

            const totalCertifications = pendingCertifications.length;
            let processedCertifications = 1;
            // Reassign Review Items API can only be called per Certification
            for (const pendingCertification of pendingCertifications) {

                if (token.isCancellationRequested) { return }
                // Build campaign reassignments map (based on the access item owner)
                let campaignReassignments = new Map<string, ReassignReference[]>()
                let pendingReassignmentCount = 0 // count the number of reassignment to do
                progress.report({
                    message: `Analysing review items in pending certification ${processedCertifications}/${totalCertifications} against reassignment logic ...`
                });
                const pendingReviewItems = await this.client.getCertificationReviewItems(pendingCertification.id, false)

                for (const pendingReviewItem of pendingReviewItems) {

                    if (token.isCancellationRequested) { return }
                    let reviewerId = await getAccessItemOwner(pendingReviewItem)

                    if (reviewerId && reviewerId === pendingReviewItem.identitySummary?.identityId) {
                        // There should always be an owner but checking to be sure
                        // Skip if access owner is the target identity => it's not possible to reassign it
                        reassignmentReport.selfassignment++
                    }
                    else if (reviewerId && reviewerId !== pendingCertification.reviewer?.id) {
                        // There should always be an owner but checking to be sure
                        // owner is not already the current reviewer
                        let reviewItems = campaignReassignments.get(reviewerId)
                        if (!reviewItems) {
                            reviewItems = []
                        }
                        reviewItems.push({ id: pendingReviewItem.id, type: ReassignReferenceTypeV3.Item })
                        pendingReassignmentCount++
                        campaignReassignments.set(reviewerId, reviewItems)
                    } else {
                        // Skip if owner is already the current reviewer
                        reassignmentReport.skip++
                    }
                }

                // Process reassignments for this Certification
                if (campaignReassignments.size > 0) {
                    try {
                        await bulkReviewItemReassigner.reassignAccessReviewItems(pendingCertification.id, campaignReassignments, reassignmentComment, processedCertifications, totalCertifications, progress, token)
                        reassignmentReport.success += pendingReassignmentCount
                    } catch (error) {
                        const errorMessage = (error instanceof Error) ? error.message : error.toString();
                        console.error(errorMessage);
                        reassignmentReport.error += pendingReassignmentCount
                        reassignmentReport.errorMessages.push(errorMessage)
                    }
                }
                processedCertifications++
            }
            return reassignmentReport
        }).then(report => {
            let messages: string[] = []
            if (report.success > 0) {
                messages.push(`${report.success} access review(s) reassigned.`)
            }

            if (report.skip > 0) {
                messages.push(`${report.skip} reassignment(s) skipped.`)
            }

            if (report.selfassignment > 0) {
                messages.push(`${report.selfassignment} review(s) could not be self-assigned.`)
            }

            if (report.error > 0) {
                messages.push(`${report.error} access reviews failed:` + report.errorMessages.join(", "))
                messages.unshift(`Reassignment for campaign ${campaignName} ended with error.`)
                vscode.window.showErrorMessage(messages.join(" "))
            } else if (report.skip > 0 || report.selfassignment > 0) {
                messages.unshift(`Reassignment for campaign ${campaignName} ended with unchanged items.`)
                vscode.window.showWarningMessage(messages.join(" "))
            } else {
                messages.unshift(successfulMessage)
                vscode.window.showInformationMessage(messages.join(" "))
            }
        })
    }

    async reassignAccessReviewItems(certificationId: string, campaignReassignments: Map<string, ReassignReference[]>, comment: string, processedCertifications: number, totalCertifications: number, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken): Promise<number> {

        const totalReviewers = campaignReassignments.size
        let reassignmentCount = 0
        let processedReviewers = 1
        // Process campaign reassignments
        // Using a for-loop instead of forEach + async code to prevent hammering API resulting in 429
        for (const [reviewerId, allReassignReferences] of campaignReassignments.entries()) {
            if (token.isCancellationRequested) { return }
            await this.processReviewItemReassignments(certificationId, reviewerId, allReassignReferences, comment, processedCertifications, totalCertifications, processedReviewers, totalReviewers, progress, token)
            reassignmentCount += allReassignReferences.length
            processedReviewers++

        }
        return reassignmentCount;
    }

    public async processReviewItemReassignments(certificationId: string, reviewerId: string, allReassignReferences: ReassignReference[], reassignReason: string, processedCertifications: number, totalCertifications: number, processedReviewers: number, totalReviewers: number, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken, sync?: boolean) {
        if (sync) {
            await this.processReviewItemReassignmentsSync(certificationId, reviewerId, allReassignReferences, reassignReason, processedCertifications, totalCertifications, processedReviewers, totalReviewers, progress, token)
        } else {
            await this.processReviewItemReassignmentsAsync(certificationId, reviewerId, allReassignReferences, reassignReason, processedCertifications, totalCertifications, processedReviewers, totalReviewers, progress, token)
        }
    }

    public async processReviewItemReassignmentsSync(certificationId: string, reviewerId: string, allReassignReferences: ReassignReference[], reassignReason: string, processedCertifications: number, totalCertifications: number, processedReviewers: number, totalReviewers: number, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken) {

        const totalBatches = Math.ceil(allReassignReferences.length / SYNC_REVIEW_ITEM_REASSIGN_LIMIT);
        let processedBatches = 1

        while (allReassignReferences.length > 0) {
            if (token.isCancellationRequested) { return }
            progress.report({
                message: `Processing certification ${processedCertifications}/${totalCertifications}: Reassigning to new reviewer ${processedReviewers}/${totalReviewers} - Batch ${processedBatches}/${totalBatches}`,
                increment: ((100 / totalCertifications) / totalReviewers) / totalBatches
            });
            // Split the reassign references to not exceed the API limit
            const reassignReferences = allReassignReferences.splice(0, SYNC_REVIEW_ITEM_REASSIGN_LIMIT);
            const certificationReassignRequest: CertificationsApiReassignIdentityCertificationsRequest = {
                id: certificationId,
                reviewReassign: {
                    reassign: reassignReferences,
                    reassignTo: reviewerId,
                    reason: reassignReason
                }
            }
            await this.client.reassignCertificationReviewItemsSync(certificationReassignRequest)
            processedBatches++
        }
    }

    public async processReviewItemReassignmentsAsync(certificationId: string, reviewerId: string, allReassignReferences: ReassignReference[], reassignReason: string, processedCertifications: number, totalCertifications: number, processedReviewers: number, totalReviewers: number, progress: vscode.Progress<{ message?: string; increment?: number; }>, token: vscode.CancellationToken) {

        const totalBatches = Math.ceil(allReassignReferences.length / ASYNC_REVIEW_ITEM_REASSIGN_LIMIT);
        let processedBatches = 1

        while (allReassignReferences.length > 0) {
            if (token.isCancellationRequested) { return }
            progress.report({
                message: `Processing certification ${processedCertifications}/${totalCertifications}: Reassigning to new reviewer ${processedReviewers}/${totalReviewers} - Batch ${processedBatches}/${totalBatches}`,
                increment: ((100 / totalCertifications) / totalReviewers) / totalBatches
            });
            // Split the reassign references to not exceed the API limit
            const reassignReferences = allReassignReferences.splice(0, ASYNC_REVIEW_ITEM_REASSIGN_LIMIT);
            const certificationReassignRequest: CertificationsApiSubmitReassignCertsAsyncRequest = {
                id: certificationId,
                reviewReassign: {
                    reassign: reassignReferences,
                    reassignTo: reviewerId,
                    reason: reassignReason
                }
            }
            await this.client.reassignCertificationReviewItemsAsync(certificationReassignRequest)
            processedBatches++
        }
    }

}