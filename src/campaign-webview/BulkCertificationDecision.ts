import * as vscode from 'vscode';
import { IdentityCertificationDtoV2025, AccessReviewItemV2025, ReviewDecisionV2025, CertificationDecisionV2025, CertificationsV2025ApiMakeIdentityDecisionRequest } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";

const DECIDE_CERTIFICATION_ITEM_LIMIT = 250;

export interface DecisionReport {
    success: number;
    error: number;
    errorMessages: string[];
}

export class BulkCertificationDecision {
    constructor(private readonly client: ISCClient) { }

    async processBulkDecision(
        certifications: IdentityCertificationDtoV2025[]
    ): Promise<DecisionReport> {
        const report: DecisionReport = {
            success: 0,
            error: 0,
            errorMessages: []
        };

        // Prompt for the decision
        const decisionOptions: { label: string; value: CertificationDecisionV2025 }[] = [
            { label: 'Approve', value: CertificationDecisionV2025.Approve },
            { label: 'Revoke', value: CertificationDecisionV2025.Revoke },
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
        const certificaionDecision: CertificationDecisionV2025 | undefined = decisionOptions.find(o => o.label === selectedValue)?.value;

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
            cancellable: true
        }, async (progress, token) => {
            const totalCertifications = certifications.length;
            let processedCertifications = 1;

            for (const certification of certifications) {
                if (token.isCancellationRequested) { return }
                // Get all review items for this certification
                const reviewItems = await this.client.getCertificationReviewItems(certification.id, false);
                const totalBatches = Math.ceil(reviewItems.length / DECIDE_CERTIFICATION_ITEM_LIMIT);
                let processedBatches = 1;

                // Process review items in batches
                while (reviewItems.length > 0) {
                    if (token.isCancellationRequested) { return }
                    progress.report({
                        message: `Processing certification ${processedCertifications}/${totalCertifications} - Batch ${processedBatches}/${totalBatches}`,
                        increment: (100 / totalCertifications) / totalBatches
                    });
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
                }

                processedCertifications++;
            }
        });

        if (report.success === 0 && report.error > 0) {
            vscode.window.showErrorMessage("No certification decisions made.")
        } else if (report.success > 0 && report.error === 0) {
            vscode.window.showInformationMessage(`${report.success} certification decisions made.`)
        } else {
            vscode.window.showWarningMessage(`${report.success} certification decisions made. Could not make ${report.error} certification decisions.`)
        }

        return report;
    }

    private async processBatch(
        certificationId: string,
        batch: AccessReviewItemV2025[],
        decision: CertificationDecisionV2025,
        comment: string
    ): Promise<void> {
        let decisions: ReviewDecisionV2025[] = [];
        batch.forEach(accessReviewItem => {
            decisions.push({ id: accessReviewItem.id, bulk: true, decision: decision, comments: comment })
        });
        const apiDecisionRequest: CertificationsV2025ApiMakeIdentityDecisionRequest = {
            id: certificationId,
            reviewDecisionV2025: decisions
        };

        await this.client.decideCertificationItems(apiDecisionRequest);
    }
} 