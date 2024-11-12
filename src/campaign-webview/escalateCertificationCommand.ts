import * as vscode from 'vscode';

import { CampaignTreeItem } from "../models/ISCTreeItem";
import { ISCClient } from '../services/ISCClient';
import { AdminReviewReassignReassignTo, AdminReviewReassignReassignToV2024TypeEnum, CertificationCampaignsApiMoveRequest, Paginator } from 'sailpoint-api-client';

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
        const getPendingCertifications =  client.processCampaignPendingCertifications(campaignId)
        const escalatePendingCertification= client.processPendingCertificationsReassignmentsToManagers(await getPendingCertifications,campaignId)
    }
}