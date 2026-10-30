import * as vscode from "vscode";
import { SourceTreeItem } from "../../models/ISCTreeItem.js";
import { ISCClient } from "../../services/ISCClient.js";
import { confirm } from "../../utils/vsCodeHelpers.js";
import { TaskStatusCompletionStatusEnum as TaskStatusCompletionStatus } from "sailpoint-api-client/dist/task_management/api.js";
import { waitForTask } from "./sourceUtils.js";
import { AccountsPanelConfig, AccountsSchemaAttribute, buildAccountsHtml } from "./accountsHtml.js";

const PAGE_SIZE = 50;

interface AccountsFilter {
	correlation?: "all" | "correlated" | "uncorrelated";
	identityId?: string;
	search?: string;
}

interface WebviewMessage {
	command?: string;
	[key: string]: any;
}

function escapeFilterValue(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Webview panel listing and managing the accounts of one source.
 * Listing is server-side (filters + pagination). Create/edit are only available for Delimited File sources.
 */
export class AccountsPanel implements vscode.Disposable {
	public static readonly viewType = "sourceAccountsView";
	public static currentPanels: Map<string, AccountsPanel> = new Map();

	private readonly disposables: vscode.Disposable[] = [];
	private readonly client: ISCClient;
	private disposed = false;
	private filter: AccountsFilter = {};
	private page = 0;
	private accounts: any[] = [];
	private schemaAttributes: AccountsSchemaAttribute[] = [];
	private identityAttribute = "";

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		private readonly node: SourceTreeItem
	) {
		this.client = new ISCClient(node.tenantId, node.tenantName);
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
		this.panel.webview.onDidReceiveMessage(
			message => this.handleMessage(message),
			null,
			this.disposables
		);
	}

	private get sourceId(): string {
		return this.node.id!;
	}

	private get sourceName(): string {
		return this.node.label as string;
	}

	private get isDelimitedFile(): boolean {
		return this.node.type === "DelimitedFile";
	}

	private static key(node: SourceTreeItem): string {
		return `${node.tenantId}/${node.id}`;
	}

	public static async createOrShow(extensionUri: vscode.Uri, node: SourceTreeItem): Promise<void> {
		const key = AccountsPanel.key(node);
		const existing = AccountsPanel.currentPanels.get(key);
		if (existing) {
			existing.panel.reveal();
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			AccountsPanel.viewType,
			`Accounts: ${node.label as string}`,
			vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);
		const accountsPanel = new AccountsPanel(panel, node);
		AccountsPanel.currentPanels.set(key, accountsPanel);
		await accountsPanel.init();
	}

	private async init(): Promise<void> {
		try {
			const schemas = await vscode.window.withProgress(
				{ location: vscode.ProgressLocation.Notification, title: `Loading schema of ${this.sourceName}...` },
				() => this.client.getSchemas(this.sourceId)
			);
			if (this.disposed) {
				return;
			}
			const schema = schemas.find(s => s.name === "account") ?? schemas[0];
			this.identityAttribute = schema?.identityAttribute ?? "";
			const displayAttribute = schema?.displayAttribute ?? "";
			const attributes: AccountsSchemaAttribute[] = (schema?.attributes ?? []).map(a => ({
				name: a.name!,
				type: String(a.type ?? "STRING"),
				multiValued: !!a.isMulti,
				description: a.description ?? undefined,
			}));
			// native identity and display name first
			const priority = [this.identityAttribute, displayAttribute].filter((x, i, arr) => x && arr.indexOf(x) === i);
			this.schemaAttributes = [
				...priority.map(n => attributes.find(a => a.name === n) ?? { name: n, type: "STRING", multiValued: false }),
				...attributes.filter(a => !priority.includes(a.name)),
			];

			const config: AccountsPanelConfig = {
				sourceName: this.sourceName,
				attributes: this.schemaAttributes,
				identityAttribute: this.identityAttribute,
				displayAttribute,
				canEnable: !!this.node.features?.includes("ENABLE"),
				canUnlock: !!this.node.features?.includes("UNLOCK"),
				editable: this.isDelimitedFile,
				pageSize: PAGE_SIZE,
			};
			this.panel.webview.html = buildAccountsHtml(config);
		} catch (error: any) {
			AccountsPanel.currentPanels.delete(AccountsPanel.key(this.node));
			this.panel.dispose();
			vscode.window.showErrorMessage(`Could not load accounts of ${this.sourceName}: ${error.message ?? error}`);
		}
	}

	private buildFilters(): string {
		const parts = [`sourceId eq "${escapeFilterValue(this.sourceId)}"`];
		if (this.filter.correlation === "correlated") {
			parts.push("uncorrelated eq false");
		} else if (this.filter.correlation === "uncorrelated") {
			parts.push("uncorrelated eq true");
		}
		if (this.filter.identityId) {
			parts.push(`identityId eq "${escapeFilterValue(this.filter.identityId)}"`);
		}
		const search = this.filter.search?.trim();
		if (search) {
			const value = escapeFilterValue(search);
			parts.push(`(name sw "${value}" or nativeIdentity sw "${value}")`);
		}
		return parts.join(" and ");
	}

	private toRow(account: any): Record<string, unknown> {
		return {
			id: account.id,
			name: account.name,
			nativeIdentity: account.nativeIdentity,
			identityId: account.identityId ?? account.identity?.id,
			identityName: account.identity?.name,
			uncorrelated: !!account.uncorrelated,
			disabled: !!account.disabled,
			locked: !!account.locked,
			attributes: account.attributes ?? {},
		};
	}

	private async load(): Promise<void> {
		try {
			const { accounts, total } = await this.client.listAccountsPage(
				this.buildFilters(), this.page * PAGE_SIZE, PAGE_SIZE);
			if (this.disposed) {
				return;
			}
			this.accounts = accounts;
			await this.post({
				command: "accounts",
				rows: accounts.map(a => this.toRow(a)),
				total,
				page: this.page,
			});
		} catch (error: any) {
			await this.post({ command: "loadFailed" });
			vscode.window.showErrorMessage(`Could not load accounts: ${error.message ?? error}`);
		}
	}

	private post(message: unknown): Thenable<boolean> {
		return this.panel.webview.postMessage(message);
	}

	private async handleMessage(message: WebviewMessage): Promise<void> {
		switch (message.command) {
			case "load":
				this.filter = message.filter ?? {};
				this.page = Number(message.page) || 0;
				await this.load();
				break;
			case "enable":
			case "disable":
			case "unlock":
				await this.toggleAccount(message.command, String(message.id));
				break;
			case "reload":
				await this.reloadAccount(String(message.id));
				break;
			case "delete":
				await this.deleteAccount(String(message.id));
				break;
			case "searchIdentities":
				await this.searchIdentities(String(message.term ?? ""), message.requestId);
				break;
			case "updateIdentity":
				await this.updateIdentity(String(message.id), String(message.identityId), String(message.identityName ?? ""));
				break;
			case "save":
				await this.save(message);
				break;
		}
	}

	private findAccount(id: string): any | undefined {
		return this.accounts.find(a => a.id === id);
	}

	private async sleep(ms: number): Promise<void> {
		await new Promise(resolve => setTimeout(resolve, ms));
	}

	private static sameValue(expected: unknown, actual: unknown): boolean {
		const norm = (v: unknown): string[] =>
			(Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])
				.map(x => String(x))
				.filter(x => x !== "")
				.sort();
		return JSON.stringify(norm(expected)) === JSON.stringify(norm(actual));
	}

	/**
	 * Runs an operation in ONE pending notification (titled `label...`): submits it, follows the asynchronous task
	 * until its end (when `followTask`), then synchronizes the table with ISC (`synchronize`, which returns true
	 * when the change is visible in ISC). Success is notified with `successMessage`.
	 * @returns false if the operation failed
	 */
	private async runOperation(
		label: string,
		successMessage: string,
		submit: () => Promise<string | undefined>,
		synchronize: () => Promise<boolean>,
		followTask = true
	): Promise<boolean> {
		return vscode.window.withProgress(
			{ location: vscode.ProgressLocation.Notification, title: `${label}...`, cancellable: false },
			async () => {
				let taskId: string | undefined;
				try {
					taskId = await submit();
				} catch (error: any) {
					vscode.window.showErrorMessage(`${label} failed: ${error.message ?? error}`);
					return false;
				}
				if (followTask && taskId) {
					const task = await waitForTask(this.client, taskId, new vscode.CancellationTokenSource().token);
					if (task === null) {
						vscode.window.showWarningMessage(`${label}: the end of the task could not be confirmed. Use Refresh to check later.`);
					} else if (task.completionStatus === TaskStatusCompletionStatus.Warning) {
						vscode.window.showWarningMessage(`${label}: completed with warning: ${task.messages?.[0]?.key ?? ""}`);
					} else if (task.completionStatus !== TaskStatusCompletionStatus.Success) {
						vscode.window.showErrorMessage(`${label} failed (${task.completionStatus}): ${task.messages?.[0]?.key ?? ""}`);
						return false;
					}
				}
				const upToDate = await synchronize();
				if (upToDate) {
					vscode.window.showInformationMessage(successMessage);
				} else if (!this.disposed) {
					vscode.window.showWarningMessage(`${label}: the change is not visible yet in ISC. Use Refresh to check later.`);
				}
				return true;
			}
		);
	}

	/**
	 * Reloads the account from ISC until the expected change is visible (or a few attempts), and updates its row
	 * @returns true if the change is visible
	 */
	private async syncAccount(id: string, isUpToDate: (account: any) => boolean): Promise<boolean> {
		let last: any;
		let upToDate = false;
		for (let attempt = 0; attempt < 5 && !this.disposed; attempt++) {
			if (attempt > 0) {
				await this.sleep(2000);
			}
			try {
				last = await this.client.getAccountById(id);
				if (isUpToDate(last)) {
					upToDate = true;
					break;
				}
			} catch (error: any) {
				console.log("syncAccount failed", error?.message ?? error);
			}
		}
		if (this.disposed) {
			return false;
		}
		if (last) {
			const index = this.accounts.findIndex(a => a.id === id);
			if (index >= 0) {
				this.accounts[index] = last;
			}
			await this.post({ command: "accountUpdated", row: this.toRow(last) });
		} else {
			await this.post({ command: "idle", id });
		}
		return upToDate;
	}

	/** The account does not exist anymore? (a list with a filter is used to avoid a 404 error) */
	private async syncDeletedAccount(id: string): Promise<boolean> {
		let deleted = false;
		for (let attempt = 0; attempt < 8 && !this.disposed; attempt++) {
			if (attempt > 0) {
				await this.sleep(2000);
			}
			try {
				const { total } = await this.client.listAccountsPage(`id eq "${escapeFilterValue(id)}"`, 0, 1);
				if (total === 0) {
					deleted = true;
					break;
				}
			} catch (error: any) {
				console.log("syncDeletedAccount failed", error?.message ?? error);
			}
		}
		if (!this.disposed) {
			await this.post({ command: "idle", id });
			await this.load();
		}
		return deleted;
	}

	/** Waits for the new account to exist, then reloads the list */
	private async syncCreatedAccount(nativeIdentity: string | undefined): Promise<boolean> {
		let found = !nativeIdentity;
		for (let attempt = 0; attempt < 5 && !this.disposed && nativeIdentity; attempt++) {
			if (attempt > 0) {
				await this.sleep(2000);
			}
			try {
				const { total } = await this.client.listAccountsPage(
					`sourceId eq "${escapeFilterValue(this.sourceId)}" and nativeIdentity eq "${escapeFilterValue(nativeIdentity)}"`, 0, 1);
				if (total > 0) {
					found = true;
					break;
				}
			} catch (error: any) {
				console.log("syncCreatedAccount failed", error?.message ?? error);
			}
		}
		if (!this.disposed) {
			await this.load();
		}
		return found;
	}

	private async toggleAccount(action: "enable" | "disable" | "unlock", id: string): Promise<void> {
		const name = this.findAccount(id)?.name ?? id;
		if (action === "disable" && !(await confirm(`Disable account ${name}?`))) {
			await this.post({ command: "idle", id });
			return;
		}
		const verb = { enable: "Enabling", disable: "Disabling", unlock: "Unlocking" }[action];
		const done = { enable: "enabled", disable: "disabled", unlock: "unlocked" }[action];
		const ok = await this.runOperation(
			`${verb} account ${name}`,
			`Account ${name} ${done}`,
			() => action === "enable" ? this.client.enableAccount(id)
				: action === "disable" ? this.client.disableAccount(id)
					: this.client.unlockAccount(id),
			() => this.syncAccount(id, a =>
				action === "enable" ? !a.disabled
					: action === "disable" ? !!a.disabled
						: !a.locked)
		);
		if (!ok) {
			await this.post({ command: "idle", id });
		}
	}

	private async reloadAccount(id: string): Promise<void> {
		const name = this.findAccount(id)?.name ?? id;
		const previousModified = this.findAccount(id)?.modified;
		const ok = await this.runOperation(
			`Reloading account ${name}`,
			`Account ${name} reloaded`,
			() => this.client.reloadAccount(id),
			() => this.syncAccount(id, a => a.modified !== previousModified)
		);
		if (!ok) {
			await this.post({ command: "idle", id });
		}
	}

	private async deleteAccount(id: string): Promise<void> {
		const name = this.findAccount(id)?.name ?? id;
		if (!(await confirm(`Delete account ${name}? It will also be deleted from the source if the connector supports it.`))) {
			await this.post({ command: "idle", id });
			return;
		}
		// the task returned by the deletion cannot be followed with /task-status:
		// the end of the deletion is detected by the disappearance of the account
		const ok = await this.runOperation(
			`Deleting account ${name}`,
			`Account ${name} deleted`,
			() => this.client.deleteAccount(id),
			() => this.syncDeletedAccount(id),
			false
		);
		if (!ok) {
			await this.post({ command: "idle", id });
		}
	}

	private async searchIdentities(term: string, requestId: unknown): Promise<void> {
		if (!term.trim()) {
			await this.post({ command: "identities", requestId, items: [] });
			return;
		}
		try {
			const identities = await this.client.searchPublicIdentities(term.trim());
			await this.post({
				command: "identities",
				requestId,
				items: identities.map(i => ({
					id: i.id,
					name: i.name,
					alias: i.alias,
					email: i.email,
				})),
			});
		} catch (error: any) {
			await this.post({ command: "identities", requestId, items: [], error: String(error.message ?? error) });
		}
	}

	private async updateIdentity(id: string, identityId: string, identityName: string): Promise<void> {
		const name = this.findAccount(id)?.name ?? id;
		await this.post({ command: "closeModal" });
		const ok = await this.runOperation(
			`Correlating account ${name}${identityName ? ` to ${identityName}` : ""}`,
			`Account ${name} correlated${identityName ? ` to ${identityName}` : ""}`,
			async () => { await this.client.updateAccount(id, identityId); return undefined; },
			() => this.syncAccount(id, a => (a.identityId ?? a.identity?.id) === identityId),
			false
		);
		if (!ok) {
			await this.post({ command: "idle", id });
		}
	}

	/**
	 * Converts the raw values of the form into API values, according to the schema
	 */
	private convertValues(raw: Record<string, unknown>, omitEmpty: boolean): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const attr of this.schemaAttributes) {
			const value = raw[attr.name];
			if (value === undefined) {
				continue;
			}
			const convertOne = (v: unknown): unknown => {
				if (attr.type === "INT" || attr.type === "LONG") {
					const n = Number(v);
					return Number.isNaN(n) ? v : n;
				}
				if (attr.type === "BOOLEAN") {
					return String(v).toLowerCase() === "true";
				}
				return v;
			};
			if (attr.multiValued) {
				const list = (Array.isArray(value) ? value : String(value).split(/\r?\n/))
					.map(v => String(v).trim())
					.filter(v => v !== "")
					.map(convertOne);
				if (list.length > 0 || !omitEmpty) {
					result[attr.name] = list;
				}
			} else {
				const text = String(value);
				if (text === "" && omitEmpty) {
					continue;
				}
				result[attr.name] = text === "" ? "" : convertOne(text);
			}
		}
		return result;
	}

	private async save(message: WebviewMessage): Promise<void> {
		if (!this.isDelimitedFile) {
			return;
		}
		const values = (message.values ?? {}) as Record<string, unknown>;
		if (message.mode === "create") {
			const attributes = this.convertValues(values, true);
			if (this.identityAttribute && attributes[this.identityAttribute] === undefined) {
				vscode.window.showErrorMessage(`Attribute ${this.identityAttribute} is required.`);
				await this.post({ command: "idle" });
				return;
			}
			const nativeIdentity = this.identityAttribute ? String(attributes[this.identityAttribute]) : undefined;
			const name = nativeIdentity ?? "";
			await this.post({ command: "closeModal" });
			await this.runOperation(
				`Creating account${name ? ` ${name}` : ""}`,
				`Account${name ? ` ${name}` : ""} created`,
				() => this.client.createAccount(this.sourceId, attributes),
				() => this.syncCreatedAccount(nativeIdentity)
			);
			await this.post({ command: "idle" });
			return;
		}

		const id = String(message.id);
		const account = this.findAccount(id);
		const name = account?.name ?? id;
		const edited = this.convertValues(values, false);
		const attributes = { ...(account?.attributes ?? {}), ...edited };
		await this.post({ command: "closeModal" });
		const ok = await this.runOperation(
			`Updating account ${name}`,
			`Account ${name} updated`,
			() => this.client.putAccount(id, attributes),
			// only the edited attributes are checked: others can be recomputed by ISC (idNowDescription, ...)
			() => this.syncAccount(id, a =>
				Object.keys(edited).every(k => AccountsPanel.sameValue(edited[k], a.attributes?.[k])))
		);
		if (!ok) {
			await this.post({ command: "idle", id });
		}
	}

	public dispose(): void {
		this.disposed = true;
		AccountsPanel.currentPanels.delete(AccountsPanel.key(this.node));
		while (this.disposables.length) {
			this.disposables.pop()?.dispose();
		}
	}
}
