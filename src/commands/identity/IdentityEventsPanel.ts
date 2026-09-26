import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from "../../services/ISCClient";
import { buildEventTableRows, buildEventsTableHtml, buildLoadingHtml } from "./identityEventsHtml";

import { EventDocumentV2025 } from "sailpoint-api-client";

export class IdentityEventsPanel implements vscode.Disposable {
    public static readonly viewType = "identityEventsView";
    public static currentPanels: Map<string, IdentityEventsPanel> = new Map();

    private readonly disposables: vscode.Disposable[] = [];
    private events: EventDocumentV2025[] = [];
    private disposed = false;
    private hasRenderedTable = false;
    private loadInFlight?: Promise<void>;

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

    /**
     * The first load replaces the webview. A later refresh posts the new rows so
     * the search, action, and status filters stay in place, and the webview
     * resets pagination itself.
     */
    private loadAndRender(): Promise<void> {
        if (this.loadInFlight) {
            return this.loadInFlight;
        }

        const refresh = this.hasRenderedTable;
        this.loadInFlight = this.fetchAndRender(refresh).finally(() => {
            this.loadInFlight = undefined;
        });
        return this.loadInFlight;
    }

    private async fetchAndRender(refresh: boolean): Promise<void> {
        const identityName = this.identityTreeItem.label as string;
        this.panel.title = `Events: ${identityName}`;

        if (!refresh) {
            this.panel.webview.html = buildLoadingHtml(identityName);
        }

        try {
            const result = await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `${refresh ? "Refreshing" : "Loading"} events for ${identityName}...`,
                    cancellable: false
                },
                async () => {
                    const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);
                    return client.getIdentityAuditEvents(this.identityTreeItem.id!, identityName);
                }
            );

            if (this.disposed) {
                return;
            }

            this.events = result.data;
            const total = typeof result.total === "number" && Number.isFinite(result.total)
                ? result.total
                : undefined;

            if (refresh) {
                await this.panel.webview.postMessage({
                    command: "eventsLoaded",
                    rows: buildEventTableRows(this.events),
                    total: total ?? null,
                });
                return;
            }

            this.panel.webview.html = buildEventsTableHtml(identityName, this.events, total);
            this.hasRenderedTable = true;
        } catch (error: any) {
            if (this.disposed) {
                return;
            }

            const message = `Could not load identity events: ${error.message ?? error}`;
            if (refresh) {
                await this.panel.webview.postMessage({ command: "refreshFailed" });
                vscode.window.showErrorMessage(`${message}. The table may be out of date.`);
                return;
            }

            IdentityEventsPanel.currentPanels.delete(this.identityTreeItem.id!);
            this.panel.dispose();
            vscode.window.showErrorMessage(message);
        }
    }

    private handleMessage(message: { command?: string; index?: number }): void {
        if (message.command === "refresh") {
            void this.loadAndRender();
            return;
        }

        if (message.command === "openEventJson" && typeof message.index === "number") {
            void this.showEventJson(message.index);
        }
    }

    private async showEventJson(index: number): Promise<void> {
        const event = this.events[index];
        if (!event) {
            return;
        }

        const title = [event.name, event.action].filter(Boolean).join(" · ") || "Event JSON";
        try {
            await this.panel.webview.postMessage({
                command: "showEventJson",
                title,
                json: JSON.stringify(event, null, 2),
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Could not show event JSON: ${error.message ?? error}`);
        }
    }

    public dispose(): void {
        this.disposed = true;
        IdentityEventsPanel.currentPanels.delete(this.identityTreeItem.id!);

        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            disposable?.dispose();
        }
    }
}
