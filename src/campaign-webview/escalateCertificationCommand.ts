import * as vscode from 'vscode';

import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';

/**
 * Command used to open the campaign panel
 */
export class EscalateCertificationCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> EscalateCertificationCommand.execute", node);
        
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)

        //TODO 
        // 1. get identities with remaining access review
        // 2. forward to manager
    }
}
