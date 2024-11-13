import * as vscode from 'vscode';
import * as commands from "../commands/constants";
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignConfigurationService } from "../services/CampaignConfigurationService";
import { TenantService } from "../services/TenantService";
import { ISCClient } from '../services/ISCClient';
import { DtoType } from 'sailpoint-api-client';
import { chooseFile } from '../utils/vsCodeHelpers';
import { CustomReviewerImporter } from './CustomReviewerImporter';

interface CustomReviewerCoverage {
    reviewerId: string,
    itemType: DtoType,
    itemIds: string[]
}

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

        const roleImporter = new CustomReviewerImporter(
            node.tenantId,
            node.tenantName,
            node.label,
            fileUri
        );
        const customReviewerCSVRecords = await roleImporter.readFileWithProgression();

        const client = new ISCClient(node.tenantId, node.tenantName)
    }
}
