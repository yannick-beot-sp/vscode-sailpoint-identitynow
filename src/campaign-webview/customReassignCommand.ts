import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { AccessReviewItem, DtoType, ReassignReference, ReassignReferenceTypeEnum } from 'sailpoint-api-client';
import { chooseFile, confirm } from '../utils/vsCodeHelpers';
import { CustomReviewerCoverage, CustomReviewerImporter } from './CustomReviewerImporter';
import { BulkReviewItemReassignment } from './BulkReviewItemReassignment';
import { isTenantReadonly, validateTenantReadonly } from '../commands/validateTenantReadonly';

const CUSTOM_REVIEWERS_DEFAULT_COMMENT = "Reassigned to the defined reviewer"

/**
 * Command used to open the campaign panel
 */
export class CustomReassignCommand {

    constructor(private tenantService: TenantService,
        private campaignService: CampaignConfigurationService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> CustomReassignCommand.execute", node);

        const fileUri = await chooseFile('CSV files', 'csv');
        if (fileUri === undefined) {
            console.log(`< CustomReassignCommand.execute: No file defined for import`, node);
            return;
        }

        const isReadOnly = isTenantReadonly(this.tenantService, node.tenantId)

        if ((isReadOnly && !(await validateTenantReadonly(this.tenantService, node.tenantId, `run a custom reviewer assignment for the campaign ${node.label}`)))
            || (!isReadOnly && !(await confirm(`Are you sure you want to run a custom reviewer assignment for the campaign ${node.label}?`)))) {
            console.log("< CustomReassignCommand.execute: no reassignment");
            return
        }

        const campaignId = node.id as string
        const client = new ISCClient(node.tenantId, node.tenantName)
        try {
            const roleImporter = new CustomReviewerImporter(
                node.tenantId,
                node.tenantName,
                node.label,
                fileUri
            );
            const customReviewerCoverageRecords = await roleImporter.readFileWithProgression();
            if (!customReviewerCoverageRecords || customReviewerCoverageRecords.length === 0) {
                vscode.window.showErrorMessage(`No valid custom reviewer records found in file ${fileUri.fsPath}.`)
                return
            }

            const bulkReviewItemReassigner = new BulkReviewItemReassignment(client)
            const pendingCertifications = await bulkReviewItemReassigner.getPendingCampaignItems(campaignId)
            if (!pendingCertifications) {
                vscode.window.showErrorMessage(`No pending certification found for campaign ${node.label}.`)
                return
            }

            // Reassign Review Items API can only be called per Certification
            for (const pendingCertification of pendingCertifications) {

                // Build campaign reassignments map (based on the access item owner)
                let campaignReassignments = new Map<string, ReassignReference[]>()
                const pendingReviewItems = await client.getCertificationReviewItems(pendingCertification.id, false)

                for (const pendingReviewItem of pendingReviewItems) {
                    // Check the current review item against each custom reviewer coverage record to see if it matches
                    const reviewerId = this.findReviewerId(pendingReviewItem, customReviewerCoverageRecords)
                    // Skip if owner is already the current reviewer
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
                await bulkReviewItemReassigner.execute(pendingCertification, campaignReassignments, CUSTOM_REVIEWERS_DEFAULT_COMMENT)
            }
            console.log(`< CustomReassignCommand.execute: Finished reassigning access review items to the defined reviewers for campaign ${node.label}`)
            vscode.window.showInformationMessage(`Finished reassigning access review items to the defined reviewers for campaign ${node.label}.`)
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : error.toString();
            console.log(`< CustomReassignCommand.execute: Error processing custom reassignment for campaign ${node.label}: ${errorMessage}`);
            vscode.window.showErrorMessage(`Error processing custom reassignment for campaign ${node.label}: ${errorMessage}`)
        }
    }

    private findReviewerId(pendingReviewItem: AccessReviewItem, customReviewerCoverageRecords: CustomReviewerCoverage[]): string | undefined {
        // Get the correct item id according to the coverage type
        let currentItemId = ""
        for (const customReviewerCoverageRecord of customReviewerCoverageRecords) {
            switch (customReviewerCoverageRecord.itemType) {
                case DtoType.Identity.toString():
                    currentItemId = pendingReviewItem.identitySummary?.identityId
                    break
                case DtoType.Entitlement.toString():
                    currentItemId = pendingReviewItem.accessSummary?.entitlement?.id
                    break
                case DtoType.AccessProfile.toString():
                    currentItemId = pendingReviewItem.accessSummary?.accessProfile?.id
                    break
                case DtoType.Role.toString():
                    currentItemId = pendingReviewItem.accessSummary?.role?.id
                    break
                default:
                    return
            }
            // return the first matching reviewer id
            if (customReviewerCoverageRecord.itemIds.indexOf(currentItemId) >= 0) {
                return customReviewerCoverageRecord.reviewerId
            }
        }
        return
    }
}
