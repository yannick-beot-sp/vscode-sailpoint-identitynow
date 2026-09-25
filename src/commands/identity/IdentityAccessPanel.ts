import * as vscode from "vscode";
import { IdentityTreeItem } from "../../models/ISCTreeItem";
import { IdentityAccessItem } from "../../models/IdentityAccessItem";
import { ISCClient } from "../../services/ISCClient";
import { buildAccessTableHtml, buildLoadingHtml } from "./identityAccessHtml";
import { confirm } from "../../utils/vsCodeHelpers";
import {
	openAccessRequestStatusPanel,
	openAccessRequestSubmitErrorPanel,
} from "./AccessRequestStatusPanel";

export class IdentityAccessPanel implements vscode.Disposable {
	public static readonly viewType = "identityAccessView";
	public static currentPanels: Map<string, IdentityAccessPanel> = new Map();

	private readonly disposables: vscode.Disposable[] = [];
	private accessItems: IdentityAccessItem[] = [];

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

	/**
	 * A failure on the initial load leaves nothing to show, so the panel is closed.
	 * A failure while refreshing after a grant or revoke keeps the panel and the
	 * previously loaded table so the user does not lose context.
	 */
	private async loadAndRender(options?: { keepOnError?: boolean }): Promise<void> {
		const identityName = this.identityName;
		this.panel.title = `Access: ${identityName}`;

		if (!options?.keepOnError) {
			this.panel.webview.html = buildLoadingHtml(identityName);
		}

		try {
			const accessItems = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Loading access for ${identityName}...`,
					cancellable: false
				},
				async () => {
					const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);
					return client.getIdentityAccess(this.identityId);
				}
			);

			this.accessItems = accessItems;
			this.panel.webview.html = buildAccessTableHtml(identityName, this.accessItems);
		} catch (error: any) {
			const message = `Could not load identity access: ${error.message ?? error}`;

			if (options?.keepOnError) {
				vscode.window.showErrorMessage(`${message}. The table may be out of date.`);
				return;
			}

			IdentityAccessPanel.currentPanels.delete(IdentityAccessPanel.panelKey(this.identityTreeItem));
			this.panel.dispose();
			vscode.window.showErrorMessage(message);
		}
	}

	private handleMessage(message: { command?: string; index?: number }): void {
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

		try {
			const content = JSON.stringify(item.raw, null, 4);
			const document = await vscode.workspace.openTextDocument({
				content,
				language: "json"
			});

			await vscode.window.showTextDocument(document, {
				preview: false,
				viewColumn: vscode.ViewColumn.Beside
			});
		} catch (error: any) {
			vscode.window.showErrorMessage(`Could not open access item JSON: ${error.message ?? error}`);
		}
	}

	private async requestAccess(): Promise<void> {
		const identityName = this.identityName;
		const accessItemId = await vscode.window.showInputBox({
			title: "Request Access",
			prompt: `Enter the ID of the role, access profile, or entitlement to grant to ${identityName}`,
			placeHolder: "Access item ID",
			validateInput: (value) => value.trim() ? undefined : "Access item ID is required",
		});

		if (!accessItemId?.trim()) {
			return;
		}

		const trimmedId = accessItemId.trim();
		const client = new ISCClient(this.identityTreeItem.tenantId, this.identityTreeItem.tenantName);
		const tenantContext = {
			tenantId: this.identityTreeItem.tenantId,
			tenantName: this.identityTreeItem.tenantName,
			identityName,
		};

		let resolvedItem: IdentityAccessItem;
		try {
			resolvedItem = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Looking up access item ${trimmedId}...`,
					cancellable: false,
				},
				async () => client.resolveAccessItemById(trimmedId)
			);
		} catch (error: unknown) {
			openAccessRequestSubmitErrorPanel(
				this.extensionUri,
				{ ...tenantContext, accessItemName: trimmedId, accessItemType: "UNKNOWN" },
				error
			);
			return;
		}

		const itemName = resolvedItem.displayName ?? resolvedItem.name ?? resolvedItem.id;
		const statusContext = {
			...tenantContext,
			accessItemName: itemName,
			accessItemType: resolvedItem.type,
		};

		try {
			const response = await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: `Submitting access request for ${itemName}...`,
					cancellable: false,
				},
				async () => client.grantIdentityAccess(this.identityId, resolvedItem)
			);

			openAccessRequestStatusPanel(this.extensionUri, {
				...statusContext,
				accessRequestIds: client.extractAccessRequestIds(response),
			});

			await this.loadAndRender({ keepOnError: true });
		} catch (error: unknown) {
			openAccessRequestSubmitErrorPanel(this.extensionUri, statusContext, error);
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

			await this.loadAndRender({ keepOnError: true });
		} catch (error: any) {
			vscode.window.showErrorMessage(
				`Could not request access removal for ${itemName}: ${error.message ?? error}`
			);
		}
	}

	public dispose(): void {
		IdentityAccessPanel.currentPanels.delete(IdentityAccessPanel.panelKey(this.identityTreeItem));

		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			disposable?.dispose();
		}
	}
}
