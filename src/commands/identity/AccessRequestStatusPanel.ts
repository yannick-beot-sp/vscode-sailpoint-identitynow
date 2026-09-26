import * as vscode from "vscode";
import { ISCClient } from "../../services/ISCClient";
import { RequestedItemStatus } from "sailpoint-api-client";
import { delay } from "../../utils";
import {
	AccessRequestStatusHistoryEntry,
	AccessRequestStatusViewState,
	buildAccessRequestStatusHtml,
	buildErrorEntryHtml,
	buildStatusEntryHtml,
	buildStatusHistoryHtml,
	buildTailBanner,
	buildTailBannerTitle,
	formatApiError,
	formatCapturedDate,
	getLastAccessRequestPhase,
	getLastPhaseTrackingKey,
} from "./accessRequestStatusHtml";
import { IdentityAccessItemType } from "../../models/IdentityAccessItem";

/**
 * Interval and cap for the status tail. The cap bounds the polling to roughly
 * 30 minutes so a request stuck in a non-terminal state cannot poll forever.
 */
const POLL_INTERVAL_MS = 5000;
const MAX_WAIT_ATTEMPTS = 40;
const MAX_TAIL_ATTEMPTS = 360;
const MAX_CONSECUTIVE_FAILURES = 3;

export interface AccessRequestStatusContext {
	tenantId: string;
	tenantName: string;
	identityName: string;
	accessItemName: string;
	accessItemType: IdentityAccessItemType | "UNKNOWN";
	accessRequestIds: string[];
	submitError?: string;
}

export class AccessRequestStatusPanel implements vscode.Disposable {
	public static readonly viewType = "accessRequestStatusView";

	private readonly disposables: vscode.Disposable[] = [];
	private readonly logs: string[] = [];
	private readonly statusHistory: AccessRequestStatusHistoryEntry[] = [];
	private readonly pendingWebviewMessages: unknown[] = [];
	private disposed = false;
	private error?: string;
	private lastRecordedPhaseKey?: string;
	private createdDate?: string;
	private webviewReady = false;

	private constructor(
		private readonly panel: vscode.WebviewPanel,
		private readonly context: AccessRequestStatusContext,
	) {
		this.error = context.submitError;

		this.panel.webview.onDidReceiveMessage(
			message => {
				if (message?.command === "ready") {
					this.webviewReady = true;
					this.postToWebview({
						command: "syncStatusHistory",
						html: buildStatusHistoryHtml(this.statusHistory, this.error),
					});
					this.flushPendingWebviewMessages();
				}
			},
			null,
			this.disposables,
		);

		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
	}

	public static createOrShow(extensionUri: vscode.Uri, context: AccessRequestStatusContext): void {
		const column = vscode.window.activeTextEditor?.viewColumn;
		const panel = vscode.window.createWebviewPanel(
			AccessRequestStatusPanel.viewType,
			`Access Request: ${context.accessItemName}`,
			column ? vscode.ViewColumn.Beside : vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri],
			}
		);

		const statusPanel = new AccessRequestStatusPanel(panel, context);
		void statusPanel.start(context);
	}

	private async start(context: AccessRequestStatusContext): Promise<void> {
		if (context.submitError) {
			this.error = context.submitError;
			this.logs.push(`[${new Date().toLocaleTimeString()}] Error submitting access request: ${context.submitError}`);
			this.panel.webview.html = buildAccessRequestStatusHtml(this.buildState(true));
			return;
		}

		const requestId = context.accessRequestIds[0];
		if (!requestId) {
			this.error = "Access request was submitted but no request ID was returned.";
			this.logs.push(`[${new Date().toLocaleTimeString()}] ${this.error}`);
			this.panel.webview.html = buildAccessRequestStatusHtml(this.buildState(true));
			return;
		}

		this.panel.webview.html = buildAccessRequestStatusHtml(this.buildState(false));
		this.appendLog(`Submitted access request ${requestId}. Waiting for it to appear in the API...`);

		try {
			await this.waitForRequestAndTail(requestId);
		} catch (error: unknown) {
			this.error = formatApiError(error);
			this.appendLog(`Error while tracking access request: ${this.error}`);
			this.publishError(this.error);
			this.setTailingComplete(true);
		}
	}

	private async waitForRequestAndTail(requestId: string): Promise<void> {
		const client = new ISCClient(this.context.tenantId, this.context.tenantName);
		let currentStatus: RequestedItemStatus | undefined;

		for (let attempt = 0; attempt < MAX_WAIT_ATTEMPTS; attempt++) {
			if (this.disposed) {
				return;
			}

			currentStatus = await client.getAccessRequestStatus(requestId);
			if (currentStatus) {
				const lastPhase = getLastAccessRequestPhase(currentStatus);
				this.appendLog(
					lastPhase
						? `Access request found. Current phase: ${lastPhase.name ?? "unknown"} (${lastPhase.state ?? "unknown"}).`
						: `Access request found. Waiting for phase updates...`
				);
				this.recordStatus(currentStatus);
				break;
			}

			this.appendLog(`Attempt ${attempt + 1}/${MAX_WAIT_ATTEMPTS}: access request not visible yet...`);
			await delay(POLL_INTERVAL_MS);
		}

		if (!currentStatus) {
			this.error = `Timed out waiting for access request ${requestId} to appear.`;
			this.publishError(this.error);
			this.setTailingComplete(true);
			return;
		}

		let currentKey = getLastPhaseTrackingKey(currentStatus);
		let consecutiveFailures = 0;
		let tailAttempts = 0;

		while (!client.isAccessRequestTerminal(currentStatus.state)) {
			if (this.disposed) {
				return;
			}

			if (tailAttempts >= MAX_TAIL_ATTEMPTS) {
				this.error = `Stopped tailing access request ${requestId} after ${MAX_TAIL_ATTEMPTS} checks without reaching a terminal state. Last known state: ${currentStatus.state ?? "unknown"}.`;
				this.appendLog(this.error);
				this.publishError(this.error);
				this.setTailingComplete(true);
				return;
			}
			tailAttempts++;

			await delay(POLL_INTERVAL_MS);
			if (this.disposed) {
				return;
			}

			let nextStatus: RequestedItemStatus | undefined;
			try {
				nextStatus = await client.getAccessRequestStatus(requestId);
				consecutiveFailures = 0;
			} catch (error: unknown) {
				consecutiveFailures++;
				const message = formatApiError(error);
				this.appendLog(
					`Could not read access request status (attempt ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}): ${message}`
				);

				if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
					throw error;
				}
				continue;
			}

			if (!nextStatus) {
				this.appendLog("Access request temporarily unavailable from the API; retrying...");
				continue;
			}

			const nextKey = getLastPhaseTrackingKey(nextStatus);
			if (nextKey !== currentKey) {
				const lastPhase = getLastAccessRequestPhase(nextStatus);
				this.appendLog(
					lastPhase
						? `Phase changed to ${lastPhase.name ?? "unknown"} (${lastPhase.state ?? "unknown"}).`
						: "Access request phases updated."
				);
				this.recordStatus(nextStatus);
			}

			currentStatus = nextStatus;
			currentKey = nextKey;
		}

		if (currentKey !== this.lastRecordedPhaseKey) {
			this.recordStatus(currentStatus);
		}

		const terminalPhase = getLastAccessRequestPhase(currentStatus);
		this.appendLog(
			terminalPhase
				? `Access request reached terminal state. Last phase: ${terminalPhase.name ?? "unknown"} (${terminalPhase.state ?? "unknown"}).`
				: `Access request reached terminal state: ${currentStatus.state ?? "unknown"}.`
		);
		this.setTailingComplete(true);
	}

	private recordStatus(status: RequestedItemStatus): void {
		const phaseKey = getLastPhaseTrackingKey(status);
		if (this.lastRecordedPhaseKey === phaseKey) {
			return;
		}

		this.lastRecordedPhaseKey = phaseKey;
		const entry: AccessRequestStatusHistoryEntry = {
			status,
		};
		this.statusHistory.push(entry);

		if (!this.createdDate && status.created) {
			this.createdDate = status.created;
			this.postToWebview({
				command: "updateRequestInfo",
				createdLabel: formatCapturedDate(status.created),
			});
		}

		// Appends are never queued: the ready handshake replays the whole history,
		// so queuing them here would render every entry twice.
		if (this.webviewReady && !this.disposed) {
			void this.panel.webview.postMessage({
				command: "appendStatus",
				html: buildStatusEntryHtml(entry.status),
			});
		}
	}

	private postToWebview(message: unknown): void {
		if (this.disposed) {
			return;
		}

		if (this.webviewReady) {
			void this.panel.webview.postMessage(message);
			return;
		}

		this.pendingWebviewMessages.push(message);
	}

	private flushPendingWebviewMessages(): void {
		for (const message of this.pendingWebviewMessages) {
			void this.panel.webview.postMessage(message);
		}
		this.pendingWebviewMessages.length = 0;
	}

	private buildState(complete: boolean): AccessRequestStatusViewState {
		return {
			identityName: this.context.identityName,
			accessItemName: this.context.accessItemName,
			accessItemType: this.context.accessItemType,
			accessRequestIds: this.context.accessRequestIds,
			createdDate: this.createdDate,
			logs: [...this.logs],
			statusHistory: [...this.statusHistory],
			error: this.error,
			complete,
		};
	}

	private appendLog(line: string): void {
		const timestamp = new Date().toLocaleTimeString();
		const entry = `[${timestamp}] ${line}`;
		this.logs.push(entry);
		this.postToWebview({ command: "appendLog", line: entry });
	}

	private publishError(error: string): void {
		this.postToWebview({ command: "appendError", html: buildErrorEntryHtml(error) });
	}

	private setTailingComplete(complete: boolean): void {
		this.postToWebview({
			command: "setTailing",
			bannerHtml: buildTailBanner(complete),
			title: buildTailBannerTitle(complete),
		});

		if (complete && !this.disposed) {
			this.panel.title = `Access Request: ${this.context.accessItemName} (complete)`;
		}
	}

	public dispose(): void {
		this.disposed = true;
		this.pendingWebviewMessages.length = 0;

		while (this.disposables.length) {
			const disposable = this.disposables.pop();
			disposable?.dispose();
		}
	}
}

export function openAccessRequestStatusPanel(
	extensionUri: vscode.Uri,
	context: AccessRequestStatusContext,
): void {
	AccessRequestStatusPanel.createOrShow(extensionUri, context);
}

export function openAccessRequestSubmitErrorPanel(
	extensionUri: vscode.Uri,
	context: Omit<AccessRequestStatusContext, "accessRequestIds">,
	error: unknown,
): void {
	AccessRequestStatusPanel.createOrShow(extensionUri, {
		...context,
		accessRequestIds: [],
		submitError: formatApiError(error),
	});
}
