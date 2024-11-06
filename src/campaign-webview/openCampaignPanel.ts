import * as vscode from 'vscode';
import { CampaignTreeItem } from "../models/ISCTreeItem";
import { CampaignPanel } from './CampaignPanel';

/**
 * Command used to open the campaign panel
 */
export class OpenCampaignPanel {
    constructor(readonly extensionUri: vscode.Uri) {
    }

    async execute(node: CampaignTreeItem): Promise<void> {
        console.log("> OpenCampaignPanel.execute", node);
        CampaignPanel.createOrShow(this.extensionUri, node.tenantId, node.tenantName, node.id, node.label as string);
    }
}
