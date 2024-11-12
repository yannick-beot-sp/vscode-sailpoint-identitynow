/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { PathProposer } from '../services/PathProposer';
import { askFile } from '../utils/vsCodeHelpers';
import { ISCClient } from '../services/ISCClient';
import * as fs from 'fs'; // install required package
import { parse } from 'json2csv'; // npm install 




/**
 * Command used to open the campaign panel
 */
export class ExportCampaignReportCommand {
    constructor() {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> ExportCampaignReportCommand.execute", node);
        
        const proposedPath = PathProposer.getCampaignReportFilename(
            node.tenantName,
            node.tenantDisplayName,
            node.label as string
        );
        const filePath = await askFile(
            "Enter the file to save the campaign report to",
            proposedPath
        );
        if (filePath === undefined) {
            return;
        }
        const campaignId = node.id as string;
        const client = new ISCClient(node.tenantId, node.tenantName)
        const getCertificationsItems =  client.getCertificationItems(campaignId)
        const generateCampaignReport= client.exportToCSV(await getCertificationsItems, filePath)
        
    }
}