import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';

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
        console.log({info});
        
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        //TODO 
        // 1. get identities with remaining access review
        // 2. call workflow to send mail
    }
}
