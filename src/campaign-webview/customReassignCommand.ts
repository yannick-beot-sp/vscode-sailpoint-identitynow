import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';

/**
 * Command used to open the campaign panel
 */
export class CustomReassignCommand {
    constructor(private tenantService: TenantService,
        private campaignService: CampaignConfigurationService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> CustomReassignCommand.execute", node);

        
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        //TODO 
        // 1. load CSV file
        // 2. cash results of queries
        // For each identity and access item, best match reassignment
    }
}
