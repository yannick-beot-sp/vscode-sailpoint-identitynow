import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignPanel } from './CampaignPanel';
import { CampaignConfigurationService } from '../services/CampaignConfigurationService';

/**
 * Command used to open the campaign panel
 */
export class OpenCampaignPanelCommand {
    constructor(readonly extensionUri: vscode.Uri,
        private campaignService: CampaignConfigurationService
    ) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> OpenCampaignPanel.execute", node);
        CampaignPanel.createOrShow(this.extensionUri, node.tenantId, node.tenantName, node.id, node.label as string, node.type, this.campaignService);
    }
}
