import * as vscode from 'vscode';
import { IdentityCertificationDto } from "sailpoint-api-client";
import { ISCClient } from "../services/ISCClient";
import { BulkWorkflowCaller } from "./BulkWorkflowCaller";


export class BulkSendReminder {

    private readonly caller: BulkWorkflowCaller
    /**
     *
     */
    constructor(private readonly workflowId: string,
        private readonly accessToken: string,
        private client: ISCClient
    ) {
        this.caller = new BulkWorkflowCaller(workflowId, accessToken, client)
    }

    public async call(reviewers: IdentityCertificationDto[]): Promise<void> {
        const data = reviewers.map(certification => {
            return {
                reviewerName: certification.reviewer?.name || 'N/A',
                reviewerId: certification.reviewer?.id || 'N/A',
                reviewerEmail: certification.reviewer?.email || 'N/A',
                campaignName: certification.campaign?.name ?? 'N/A',
                completedDecisions: certification.decisionsMade,
                totalDecisions: certification.decisionsTotal,
                pendingItems: (certification.decisionsTotal - certification.decisionsMade),
                completedIdentities: certification.identitiesCompleted,
                totalIdentities: certification.identitiesTotal,
                pendingIdentities: (certification.identitiesTotal - certification.identitiesCompleted),
                dueDate: certification.due
            }
        })

        const result = await this.caller.call(data)

        if (result.success === 0 && result.errors.length > 0) {
            vscode.window.showErrorMessage("No reminder mail sent.")
        } else if (result.success > 0 && result.errors.length === 0) {
            vscode.window.showInformationMessage(`${result.success} reminder  mail(s) sent successfully.`)
        } else {
            vscode.window.showWarningMessage(`${result.success} reminder  mail(s) sent successfully. Could not send mails to: ${result.errors.join(", ")}`)
        }

    }
}