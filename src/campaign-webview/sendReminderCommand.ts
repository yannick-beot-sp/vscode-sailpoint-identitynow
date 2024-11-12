import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { BulkSendReminder } from './BulkSendReminder';
import { confirm } from '../utils/vsCodeHelpers';

/**
 * Command used to open the campaign panel
 */
export class SendReminderCommand {
    constructor(private tenantService: TenantService,
        private campaignService: CampaignConfigurationService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> SendReminderCommand.execute", node);

        const info = await this.campaignService.getCertificationCampaignInfo(node.tenantName)
        if (info === undefined) {
            vscode.window.showWarningMessage("Workflow is not configured.")
            vscode.commands.executeCommand(commands.CAMPAIGN_CONFIGURE_REMINDER, node);
            return
        }

        if (!(await confirm(`Do you want to send a reminder to all reviewers of ${node.label}?`))) {
            console.log("< SendReminderCommand.execute: no reassignment");
            return
        }
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)

        // 1. get identities with remaining access review
        const reviewers = await client.getCertificationAccessReview(campaignId, false)

        // 2. call workflow to send mail
        const sender = new BulkSendReminder(
            info.workflowSendingReminderId,
            (await this.campaignService.getWorkflowAccessToken(node.tenantName)),
            client)
        await sender.call(reviewers)
    }
}
