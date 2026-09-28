import * as vscode from 'vscode';
import { ISCClient } from "../services/ISCClient.js";
import { AccessReviewItem, CertificationDecision, CertificationsApiMakeIdentityDecisionV1Request, IdentityCertificationDto, ReviewDecision } from 'sailpoint-api-client/dist/certifications/api.js';

const DECIDE_CERTIFICATION_ITEM_LIMIT = 250;

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
        const decisionOptions: (vscode.QuickPickItem & { value: CertificationDecision })[] = [
            { label: 'Approve', value: CertificationDecision.Approve },
            { label: 'Revoke', value: CertificationDecision.Revoke },
        ];
        const selectedValue = await vscode.window.showQuickPick(decisionOptions, {
            placeHolder: 'Select the bulk decision:',
            canPickMany: false,
        });

        if (!selectedValue) {
            // User canceled the QuickPick
            vscode.window.showInformationMessage('Bulk decision canceled.');
            report.errorMessages.push('Bulk decision canceled.')
            return report;
        }

        const certificationDecision = selectedValue.value;

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
                const reviewItems = await this.client.getCertificationReviewItems(certification.id!, false);
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
                        await this.processBatch(certification.id!, batch, certificationDecision, comment);
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
        batch: AccessReviewItem[],
        decision: CertificationDecision,
        comment: string
    ): Promise<void> {
        let decisions: ReviewDecision[] = [];
        batch.forEach(accessReviewItem => {
            decisions.push({ id: accessReviewItem.id!, bulk: true, decision: decision, comments: comment })
        });
        const apiDecisionRequest: CertificationsApiMakeIdentityDecisionV1Request = {
            id: certificationId,
            reviewDecision: decisions
        };

        await this.client.decideCertificationItems(apiDecisionRequest);
    }
} 