import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem.js";
import { TenantService } from "../services/TenantService.js";
import { ISCClient } from '../services/ISCClient.js';
import { AccessReviewItem } from 'sailpoint-api-client/dist/certifications/api.js';
import { chooseFile, confirm } from '../utils/vsCodeHelpers.js';
import { CustomReviewerCoverage, CustomReviewerImporter } from './CustomReviewerImporter.js';
import { BulkReviewItemReassignment, getPendingCampaignItems } from './BulkReviewItemReassignment.js';
import { isTenantReadonly, validateTenantReadonly } from '../commands/validateTenantReadonly.js';

const CUSTOM_REVIEWERS_DEFAULT_COMMENT = "Reassigned to the defined reviewer"

/**
 * Command used to reassign access review item based on a file
 */
export class CustomReassignCommand {

    constructor(private tenantService: TenantService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> CustomReassignCommand.execute", node);

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)

        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `run a custom reviewer assignment for the campaign ${node.label}`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to run a custom reviewer assignment for the campaign ${node.label}?`)))) {
            console.log("< CustomReassignCommand.execute: no reassignment");
            return
        }

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) {
            console.log(`< CustomReassignCommand.execute: No file defined for import`, node);
            return;
        }

        const campaignId = node.id as string
        const client = new ISCClient(node.tenantId, node.tenantName)
        try {
            const customReviewerImporter = new CustomReviewerImporter(
                node.tenantId,
                node.tenantName,
                node.label as string,
                fileUri
            );
            const customReviewerCoverageRecords = await customReviewerImporter.readFileWithProgression();
            if (!customReviewerCoverageRecords || customReviewerCoverageRecords.length === 0) {
                vscode.window.showErrorMessage(`No valid custom reviewer records found in file ${fileUri.fsPath}.`)
                return
            }

            const bulkReviewItemReassigner = new BulkReviewItemReassignment(client)
            
            const report = await bulkReviewItemReassigner.reassignCampaign(
                campaignId,
                `Reassigning items of ${node.label} based on ${fileUri.fsPath}`,
                node.label as string,
                CUSTOM_REVIEWERS_DEFAULT_COMMENT,
                `Successfully reassigned items for campaign ${node.label} to the defined reviewers.`,
                async (pendingReviewItem: AccessReviewItem) => {
                    return await this.findReviewerId(pendingReviewItem, customReviewerCoverageRecords)
                }
            )

            console.log(`< CustomReassignCommand.execute: Finished reassigning access review items to the defined reviewers for campaign ${node.label}`, report)
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(`< CustomReassignCommand.execute: Error processing custom reassignment for campaign ${node.label}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error processing custom reassignment for campaign ${node.label}: ${errorMessage}`)
        }
    }

    private findReviewerId(pendingReviewItem: AccessReviewItem, customReviewerCoverageRecords: CustomReviewerCoverage[]): string | undefined {
        // Get the correct item id according to the coverage type
        let currentItemId = ""
        for (const customReviewerCoverageRecord of customReviewerCoverageRecords) {
            switch (customReviewerCoverageRecord.itemType) {
                case "ALL":
                    return customReviewerCoverageRecord.reviewerId
                case "IDENTITY":
                    currentItemId = pendingReviewItem.identitySummary?.identityId
                    break
                case "ENTITLEMENT":
                    currentItemId = pendingReviewItem.accessSummary?.entitlement?.id
                    break
                case "ACCESS_PROFILE":
                    currentItemId = pendingReviewItem.accessSummary?.accessProfile?.id
                    break
                case "ROLE":
                    currentItemId = pendingReviewItem.accessSummary?.role?.id
                    break
                default:
                    return
            }
            // Check if self review
            const selfReview = (pendingReviewItem.identitySummary?.identityId === customReviewerCoverageRecord.reviewerId)
            // Set the current reviewer if the review item is of the correct type and
            // either using a generic selector or the item matched the selector
            if (currentItemId && !selfReview && (customReviewerCoverageRecord.isAllItems || customReviewerCoverageRecord.itemIds.indexOf(currentItemId) >= 0)) {
                return customReviewerCoverageRecord.reviewerId
            }
        }
        return
    }
}
