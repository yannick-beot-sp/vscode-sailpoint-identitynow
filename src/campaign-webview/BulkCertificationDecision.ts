import * as vscode from 'vscode';
import { CertificationsApiMakeIdentityDecisionRequest, IdentityCertificationDto, AccessReviewItem, ReviewDecision, CertificationDecision } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

const DECIDE_CERTIFICATION_ITEM_LIMIT = 500;

export interface DecisionReport {
    success: number;
    error: number;
    errorMessages: string[];
}

export class BulkCertificationDecision {
    constructor(private readonly client: ISCClient) { }

    async processBulkDecision(
        certifications: IdentityCertificationDto[]
    ): Promise<DecisionReport> {
        const report: DecisionReport = {
            success: 0,
            error: 0,
            errorMessages: []
        };

        // Prompt for the decision
        const decisionOptions: { label: string; value: CertificationDecision }[] = [
            { label: 'Approve', value: CertificationDecision.Approve },
            { label: 'Revoke', value: CertificationDecision.Revoke },
        ];
        const selectedValue = await vscode.window.showQuickPick(
            decisionOptions.map(option => option.label),
            {
                placeHolder: 'Select the bulk decision:',
                canPickMany: false,
            }
        );

        if (!selectedValue) {
            // User canceled the QuickPick
            vscode.window.showInformationMessage('Bulk decision canceled.');
            report.errorMessages.push('Bulk decision canceled.')
            return report;
        }

        // Map decision label back to the CertificationDecision
        const certificaionDecision: CertificationDecision | undefined = decisionOptions.find(o => o.label === selectedValue)?.value;

        // Prompt for a comment
        const comment = await vscode.window.showInputBox({
            prompt: 'Enter a comment:',
            placeHolder: 'Type your comment here...',
            ignoreFocusOut: true,
            validateInput: (value: string) => {
                if (!value) {
                    return 'Please enter a comment.';
                }
                return null;
            },
        });

        if (!comment) {
            // User canceled the input box
            vscode.window.showInformationMessage('Bulk decision canceled.');
            report.errorMessages.push('Bulk decision canceled.')
            return report;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Processing ${certifications.length} certifications`,
            cancellable: false
        }, async (progress) => {
            const totalCertifications = certifications.length;
            let processedCertifications = 0;

            for (const certification of certifications) {
                try {
                    // Get all review items for this certification
                    const reviewItems = await this.client.getCertificationReviewItems(certification.id, false);
                    const totalBatches = Math.ceil(reviewItems.length / DECIDE_CERTIFICATION_ITEM_LIMIT);
                    let processedBatches = 0;

                    // Process review items in batches
                    while (reviewItems.length > 0) {
                        const batch = reviewItems.splice(0, DECIDE_CERTIFICATION_ITEM_LIMIT);

                        try {
                            await this.processBatch(certification.id, batch, certificaionDecision, comment);
                            report.success += batch.length;
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            report.error += batch.length;
                            report.errorMessages.push(
                                `Error processing batch for certification ${certification.id}: ${errorMessage}`
                            );
                        }

                        processedBatches++;
                        progress.report({
                            message: `Processing certification ${processedCertifications + 1}/${totalCertifications} - Batch ${processedBatches}/${totalBatches}`,
                            increment: (100 / totalCertifications) / totalBatches
                        });
                    }

                    processedCertifications++;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    report.errorMessages.push(
                        `Error fetching review items for certification ${certification.id}: ${errorMessage}`
                    );
                }
            }
        });

        return report;
    }

    private async processBatch(
        certificationId: string,
        batch: AccessReviewItem[],
        decision: CertificationDecision,
        comment: string
    ): Promise<void> {
        let decisions: ReviewDecision[] = [];
        batch.forEach(accessReviewItem => {
            decisions.push({ id: accessReviewItem.id, bulk: true, decision: decision, comments: comment })
        });
        const apiDecisionRequest: CertificationsApiMakeIdentityDecisionRequest = {
            id: certificationId,
            reviewDecision: decisions
        };

        await this.client.decideCertificationItems(apiDecisionRequest);
    }
} 