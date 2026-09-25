import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from "../../services/ISCClient";
import { buildEventsTableHtml, buildLoadingHtml } from "./identityEventsHtml";

import { EventDocumentV2025 } from 'sailpoint-api-client';
export class IdentityEventsPanel implements vscode.Disposable {
    public static readonly viewType = "identityEventsView";
    public static currentPanels: Map<string, IdentityEventsPanel> = new Map();

    private readonly disposables: vscode.Disposable[] = [];
    private events: EventDocumentV2025[] = [];

    private constructor(
        private readonly panel: vscode.WebviewPanel,
        private readonly identityTreeItem: IdentityTreeItem
    ) {
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            null,
            this.disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri, identityTreeItem: IdentityTreeItem): void {
        const identityId = identityTreeItem.id!;
        const identityName = identityTreeItem.label as string;
        const column = vscode.window.activeTextEditor?.viewColumn;

        const existing = IdentityEventsPanel.currentPanels.get(identityId);
        if (existing) {
            existing.panel.reveal(column);
            void existing.loadAndRender();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            IdentityEventsPanel.viewType,
            `Events: ${identityName}`,
            column ?? vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        const identityEventsPanel = new IdentityEventsPanel(panel, identityTreeItem);
        IdentityEventsPanel.currentPanels.set(identityId, identityEventsPanel);
        void identityEventsPanel.loadAndRender();
    }

    private async loadAndRender(): Promise<void> {
        const identityName = this.identityTreeItem.label as string;
        this.panel.title = `Events: ${identityName}`;
        this.panel.webview.html = buildLoadingHtml(identityName);

        try {
            const result = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Loading events for ${identityName}...`,
                    cancellable: false
                },
                async () => {
                    const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);
                    return client.getIdentityAuditEvents(this.identityTreeItem.id!, identityName);
                }
            );

            this.events = result.data;
            this.panel.webview.html = buildEventsTableHtml(
                identityName,
                this.events,
                result.total
            );
        } catch (error: any) {
            IdentityEventsPanel.currentPanels.delete(this.identityTreeItem.id!);
            this.panel.dispose();
            vscode.window.showErrorMessage(`Could not load identity events: ${error.message ?? error}`);
        }
    }

    private handleMessage(message: { command?: string; index?: number }): void {
        if (message.command === "openEventJson" && typeof message.index === "number") {
            void this.openEventJson(message.index);
        }
    }

    private async openEventJson(index: number): Promise<void> {
        const event = this.events[index];
        if (!event) {
            return;
        }

        const content = JSON.stringify(event, null, 4);
        const document = await vscode.workspace.openTextDocument({
            content,
            language: "json"
        });

        await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.Beside
        });
    }

    public dispose(): void {
        IdentityEventsPanel.currentPanels.delete(this.identityTreeItem.id!);

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            disposable?.dispose();
        }
    }
}
