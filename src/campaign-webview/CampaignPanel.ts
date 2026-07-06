
import * as vscode from 'vscode';
import * as commands from './app/src/services/Commands';
import * as extensionCommands from "../commands/constants";
import { ISCClient } from '../services/ISCClient';
import { FetchOptions, PaginatedData } from './app/src/lib/datatable/Model';
import { Reviewer } from './app/src/services/Client';
import { KPIsAndReviewersQuery } from './KPIsAndReviewersQuery';
import { BulkSendReminder } from './BulkSendReminder';
import { CampaignConfigurationService } from '../services/CampaignConfigurationService';
import { CampaignsTreeItem } from '../models/ISCTreeItem';
import { BulkCampaignManagerEscalation } from './BulkCampaignManagerEscalation';
import { IdentityCertificationDto } from 'sailpoint-api-client';
import { BulkCertificationDecision } from './BulkCertificationDecision';
import { BaseWebviewPanel } from '../webview/BaseWebviewPanel';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'campaign-webview', 'assets')]
    };
}

export class CampaignPanel extends BaseWebviewPanel {

    public static currentPanels: Map<string, CampaignPanel> = new Map()
    public static readonly viewType = 'campaignView';
    private readonly client: ISCClient;

    public static createOrShow(extensionUri: vscode.Uri,
        tenantId: string,
        tenantName: string,
        campaignId: string,
        campaignName: string,
        campaignType: string,
        campaignService: CampaignConfigurationService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (CampaignPanel.currentPanels[campaignId]) {
            CampaignPanel.currentPanels[campaignId]._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            CampaignPanel.viewType,
            campaignName,
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri)
        );

        CampaignPanel.currentPanels[campaignId] = new CampaignPanel(
            panel,
            extensionUri,
            tenantId,
            tenantName,
            campaignId,
            campaignName,
            campaignType,
            campaignService);
    }

    public dispose() {
        for (let [key, value] of CampaignPanel.currentPanels) {
            value.dispose()
        }
        CampaignPanel.currentPanels = new Map();

        super.dispose();
    }


    /**
     * TODO Serializer

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
    }*/


    private constructor(panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private tenantId: string,
        private tenantName: string,
        private campaignId: string,
        private campaignName: string,
        private campaignType: string,
        private campaignService: CampaignConfigurationService) {
        super(panel, extensionUri);
        this.client = new ISCClient(this.tenantId, this.tenantName);
        // BaseWebviewPanel's constructor renders the webview HTML (and sets the panel title)
        // before the parameter properties above are assigned, so that first render happens
        // with everything undefined. Re-render now that the fields are set.
        this.update();
    }

    protected get webviewFolderName(): string {
        return 'campaign-webview';
    }

    protected get title(): string {
        return this.campaignName;
    }

    protected get initialData(): Record<string, unknown> {
        return {
            campaignId: this.campaignId,
            campaignName: this.campaignName,
            campaignType: this.campaignType
        };
    }

    protected async handleMessage(message: any): Promise<void> {
        const client = this.client;
        const { command, requestId, payload } = message;
        switch (command) {
            case commands.GET_KPIS_AND_REVIEWERS:
                const kpIsAndReviewersQuery = new KPIsAndReviewersQuery(client)
                const kpIsAndReviewersQueryResult = await kpIsAndReviewersQuery.execute(this.campaignId)
                this._panel.webview.postMessage({ command, requestId, payload: kpIsAndReviewersQueryResult });
                return;

            case commands.GET_PAGINATED_REVIEWERS:
                const { currentPage, pageSize, sort } = payload as FetchOptions
                let sorters = sort?.field ?? "name"
                if (sort?.order === "desc") {
                    sorters = "-" + sorters
                }

                const response = await client.getPaginatedCampaignCertifications({
                    campaignId: this.campaignId,
                    offset: currentPage * pageSize,
                    limit: pageSize,
                    sorters
                })

                const reviewers = response.data.map(r => {
                    return {
                        ...r,
                        name: r.reviewer.name,
                        email: r.reviewer.email,
                        identitiesRemaining: r.identitiesTotal - r.identitiesCompleted,
                        decisionsRemaining: r.decisionsTotal - r.decisionsMade,
                        reassignmentName: r.reassignment?.from?.name,
                        reassignmentComment: r.reassignment?.comment,
                        reassignmentEmail: r.reassignment?.from?.reviewer?.email

                    }
                })

                this._panel.webview.postMessage({ command, requestId, payload: { data: reviewers, count: response.count } as PaginatedData<Reviewer> });
                return;

            case commands.SEND_REMINDERS:
                const info = await this.campaignService.getCertificationCampaignInfo(this.tenantName)
                if (info === undefined) {
                    vscode.window.showWarningMessage("You must configure the workflow to send mails.")
                    vscode.commands.executeCommand(extensionCommands.CAMPAIGN_CONFIGURE_REMINDER, new CampaignsTreeItem(this.tenantId, this.tenantName, ""));
                    return
                }
                const sender = new BulkSendReminder(
                    info.workflowSendingReminderId,
                    (await this.campaignService.getWorkflowAccessToken(this.tenantName)),
                    client)
                await sender.call(payload)
                return;

            case commands.ESCALATE_REVIEWERS:
                const bulkManagerEscalator = new BulkCampaignManagerEscalation(client)
                await bulkManagerEscalator.escalateCertifications(this.campaignId,
                    this.campaignName,
                    payload as IdentityCertificationDto[])
                this._panel.webview.postMessage({ command, requestId, payload: { data: "OK" } });
                return;

            case commands.GET_STATUS:
                const campaign = await client.getCampaign(payload)
                this._panel.webview.postMessage({ command, requestId, payload: campaign.status });
                return;

            case commands.BULK_DECISION:
                const bulkDecision = new BulkCertificationDecision(client);
                const report = await bulkDecision.processBulkDecision(payload as IdentityCertificationDto[]);
                this._panel.webview.postMessage({ command, requestId, payload: report });
                return;
        }
    }
}
