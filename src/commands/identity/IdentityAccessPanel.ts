import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem.js";
import { IdentityAccessItem } from "../../models/IdentityAccessItem.js";
import { ISCClient } from "../../services/ISCClient.js";
import { buildAccessTableHtml, buildAccessTableRows, buildLoadingHtml } from "./identityAccessHtml.js";
import { confirm } from "../../utils/vsCodeHelpers.js";
import { requestIdentityAccess } from "./requestIdentityAccess.js";

export class IdentityAccessPanel implements vscode.Disposable {
	public static readonly viewType = "identityAccessView";
	public static currentPanels: Map<string, IdentityAccessPanel> = new Map();

	private readonly disposables: vscode.Disposable[] = [];
	private accessItems: IdentityAccessItem[] = [];
	private disposed = false;
	private hasRenderedTable = false;
	private loadInFlight?: Promise<void>;

	private constructor(
		private readonly extensionUri: vscode.Uri,
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

	private get identityId(): string {
		return this.identityTreeItem.id!;
	}

	private get identityName(): string {
		return this.identityTreeItem.label as string;
	}

	private static panelKey(identityTreeItem: IdentityTreeItem): string {
		return `${identityTreeItem.tenantId}/${identityTreeItem.id}`;
	}

	public static createOrShow(extensionUri: vscode.Uri, identityTreeItem: IdentityTreeItem): void {
		const identityName = identityTreeItem.label as string;
		const column = vscode.window.activeTextEditor?.viewColumn;
		const key = IdentityAccessPanel.panelKey(identityTreeItem);

		const existing = IdentityAccessPanel.currentPanels.get(key);
		if (existing) {
			existing.panel.reveal(column);
			void existing.loadAndRender();
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			IdentityAccessPanel.viewType,
			`Access: ${identityName}`,
			column ?? vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		const identityAccessPanel = new IdentityAccessPanel(extensionUri, panel, identityTreeItem);
		IdentityAccessPanel.currentPanels.set(key, identityAccessPanel);
		void identityAccessPanel.loadAndRender();
	}

	public static refreshIfOpen(identityTreeItem: IdentityTreeItem): void {
		void IdentityAccessPanel.currentPanels.get(IdentityAccessPanel.panelKey(identityTreeItem))?.loadAndRender();
	}

	/**
	 * The first load replaces the webview. A later refresh posts the new rows so
	 * the type, name, and source filters stay in place, and the webview resets
	 * pagination itself. A failure on the initial load closes the panel. A failure
	 * while refreshing keeps the previously loaded table.
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
		const identityName = this.identityName;
		this.panel.title = `Access: ${identityName}`;

		if (!refresh) {
			this.panel.webview.html = buildLoadingHtml(identityName);
		}

		try {
			const accessItems = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `${refresh ? "Refreshing" : "Loading"} access for ${identityName}...`,
					cancellable: false
				},
				async () => {
					const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);
					return client.getIdentityAccess(this.identityId);
				}
			);

			if (this.disposed) {
				return;
			}

			this.accessItems = accessItems;

			if (refresh) {
				await this.panel.webview.postMessage({
					command: "accessLoaded",
					rows: buildAccessTableRows(this.accessItems),
				});
				return;
			}

			this.panel.webview.html = buildAccessTableHtml(identityName, this.accessItems);
			this.hasRenderedTable = true;
		} catch (error: any) {
			if (this.disposed) {
				return;
			}

			const message = `Could not load identity access: ${error.message ?? error}`;

			if (refresh) {
				await this.panel.webview.postMessage({ command: "refreshFailed" });
				vscode.window.showErrorMessage(`${message}. The table may be out of date.`);
				return;
			}

			IdentityAccessPanel.currentPanels.delete(IdentityAccessPanel.panelKey(this.identityTreeItem));
			this.panel.dispose();
			vscode.window.showErrorMessage(message);
		}
	}

	private handleMessage(message: { command?: string; index?: number }): void {
		if (message.command === "refresh") {
			void this.loadAndRender();
			return;
		}

		if (message.command === "openAccessJson" && typeof message.index === "number") {
			void this.openAccessJson(message.index);
			return;
		}

		if (message.command === "requestRemoval" && typeof message.index === "number") {
			void this.requestRemoval(message.index);
			return;
		}

		if (message.command === "requestAccess") {
			void this.requestAccess();
		}
	}

	private async openAccessJson(index: number): Promise<void> {
		const item = this.accessItems[index];
		if (!item) {
			return;
		}

		const title = item.displayName ?? item.name ?? item.id;
		try {
			await this.panel.webview.postMessage({
				command: "showAccessJson",
				title,
				json: JSON.stringify(item.raw, null, 2),
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(`Could not show access item JSON: ${error.message ?? error}`);
		}
	}

	private async requestAccess(): Promise<void> {
		if (await requestIdentityAccess(this.extensionUri, this.identityTreeItem)) {
			await this.loadAndRender();
		}
	}

	private async requestRemoval(index: number): Promise<void> {
		const item = this.accessItems[index];
		if (!item) {
			return;
		}

		const itemName = item.displayName ?? item.name ?? item.id;
		const identityName = this.identityName;

		if (!(await confirm(`Revoke ${itemName} for ${identityName}?`))) {
			return;
		}

		const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);

		try {
			const response = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Requesting removal of ${itemName} for ${identityName}...`,
					cancellable: false
				},
				async () => client.revokeIdentityAccess(this.identityId, item)
			);

			const isExistingOnly = (response.newRequests?.length ?? 0) === 0
				&& client.extractAccessRequestIds(response).length > 0;

			vscode.window.showInformationMessage(
				isExistingOnly
					? `An existing access removal request already exists for ${itemName}.`
					: `Access removal request submitted for ${itemName}.`
			);

			await this.loadAndRender();
		} catch (error: any) {
			vscode.window.showErrorMessage(
				`Could not request access removal for ${itemName}: ${error.message ?? error}`
			);
		}
	}

	public dispose(): void {
		this.disposed = true;
		IdentityAccessPanel.currentPanels.delete(IdentityAccessPanel.panelKey(this.identityTreeItem));

		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			disposable?.dispose();
		}
	}
}
