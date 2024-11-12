import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { confirm } from '../utils/vsCodeHelpers';

/**
 * Command used to open the campaign panel
 */
export class ReassignOwnersCommand {
    constructor(private tenantService: TenantService,
        private campaignService: CampaignConfigurationService) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> ReassignOwnersCommand.execute", node);

        if (!(await confirm(`Are you sure you want to reassign access item reviews to their owners for the campaign ${node.label}?`))) {
            console.log("< ReassignOwnersCommand.execute: no reassignment");
            return
        }
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        //TODO 
        // 1. get all open access items
        // 2. get owners for each
        // 3. reassign item (Bulk?)
    }
}
