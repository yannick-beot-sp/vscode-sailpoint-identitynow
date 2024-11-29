import * as vscode from 'vscode';

import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';
import { confirm } from '../utils/vsCodeHelpers';
import { BulkCampaignManagerEscalation } from './BulkCampaignManagerEscalation';

/**
 * Command used to open the campaign panel
 */
export class EscalateCertificationCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> EscalateCertificationCommand.execute", node);

        if (!(await confirm(`Are you sure you want to escalate all pending certifications to the reviewer managers for the campaign ${node.label}?`))) {
            console.log("< EscalateCertificationCommand.execute: no reassignment");
            return
        }

        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)

        try {
            const bulkManagerEscalator = new BulkCampaignManagerEscalation(client)
            bulkManagerEscalator.escalateCampaign(campaignId)
        }
        catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : error.toString();
            console.log(`< EscalateCertificationCommand.execute: Error processing campaign with ID ${campaignId}: ${errorMessage}`);
        }
    }
}