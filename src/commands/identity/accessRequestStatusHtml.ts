import { AccessRequestPhases, RequestedItemStatus } from "../../sailpointCompat";

export interface AccessRequestStatusHistoryEntry {
	status: RequestedItemStatus;
	capturedAt: string;
}

export interface AccessRequestStatusViewState {
	identityName: string;
	accessItemName: string;
	accessItemType: string;
	accessRequestIds: string[];
	createdDate?: string;
	logs: string[];
	statusHistory: AccessRequestStatusHistoryEntry[];
	error?: string;
	complete: boolean;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function getNonce(): string {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function formatTypeLabel(type: string): string {
	switch (type) {
		case "ROLE":
			return "Role";
		case "ACCESS_PROFILE":
			return "Access Profile";
		case "ENTITLEMENT":
			return "Entitlement";
		default:
			return type;
	}
}

function formatDateTime(value?: string | null): string | undefined {
	if (!value) {
		return undefined;
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleString();
}

function iconSvg(kind: "tailing" | "complete"): string {
	switch (kind) {
		case "tailing":
			// "loading" codicon, microsoft/vscode-codicons, CC BY 4.0
			return `<svg class="status-icon-svg tail-spin" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true"><path d="M13.5 8.5C13.224 8.5 13 8.276 13 8C13 5.243 10.757 3 8 3C5.243 3 3 5.243 3 8C3 8.276 2.776 8.5 2.5 8.5C2.224 8.5 2 8.276 2 8C2 4.691 4.691 2 8 2C11.309 2 14 4.691 14 8C14 8.276 13.776 8.5 13.5 8.5Z"/></svg>`;
		case "complete":
			return `<svg class="status-icon-svg" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M6.78 11.28 3.72 8.22l.94-.94 2.12 2.12 4.56-4.56.94.94z"/><path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm0 1.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/></svg>`;
	}
}

function buildStatusIcon(kind: "tailing" | "complete"): string {
	return `<span class="status-icon status-icon-${kind}">${iconSvg(kind)}</span>`;
}

export function getLastAccessRequestPhase(status?: RequestedItemStatus): AccessRequestPhases | undefined {
	const phases = status?.accessRequestPhases;
	if (!phases?.length) {
		return undefined;
	}
	return phases[phases.length - 1];
}

export function getLastPhaseTrackingKey(status: RequestedItemStatus): string {
	const phases = status.accessRequestPhases;
	if (!phases?.length) {
		return JSON.stringify({
			fallback: "state",
			state: status.state ?? "",
			modified: status.modified ?? "",
		});
	}

	return JSON.stringify(
		phases.map(phase => ({
			name: phase.name ?? "",
			state: phase.state ?? "",
			result: phase.result ?? "",
			started: phase.started ?? "",
			finished: phase.finished ?? "",
		})),
	);
}

function buildLastPhaseSection(phase?: AccessRequestPhases): string {
	const parts = [
		`<div class="status-entry-title">${escapeHtml(phase?.name ?? "—")}</div>`,
		`<div><strong>Phase state:</strong> ${escapeHtml(phase?.state ?? "—")}</div>`,
	];

	if (phase?.result) {
		parts.push(`<div><strong>Phase result:</strong> ${escapeHtml(phase.result)}</div>`);
	}

	if (phase?.started) {
		parts.push(`<div><strong>Phase started:</strong> ${escapeHtml(formatDateTime(phase.started) ?? phase.started)}</div>`);
	}

	if (phase?.finished) {
		parts.push(`<div><strong>Phase finished:</strong> ${escapeHtml(formatDateTime(phase.finished) ?? phase.finished)}</div>`);
	}

	return parts.join("");
}

function formatStatusErrors(status?: RequestedItemStatus): string | undefined {
	if (!status?.errorMessages?.length) {
		return undefined;
	}

	return status.errorMessages
		.flatMap(group => group.map(message => message.text ?? message.locale ?? JSON.stringify(message)))
		.join("\n");
}

function buildLogLines(logs: string[]): string {
	if (logs.length === 0) {
		return `<div class="log-line muted">Waiting for updates...</div>`;
	}

	return logs.map(line => `<div class="log-line">${escapeHtml(line)}</div>`).join("");
}

export function buildTailBanner(complete: boolean): string {
	if (complete) {
		return `<div id="tail-banner" class="tail-banner complete">${buildStatusIcon("complete")}<span>Complete</span></div>`;
	}
	return `<div id="tail-banner" class="tail-banner tailing">${buildStatusIcon("tailing")}<span>Tailing</span></div>`;
}

export function buildTailBannerTitle(complete: boolean): string {
	return complete ? "Access Request Complete" : "Access Request Status";
}

export function formatCapturedDate(value?: string | null): string {
	return formatDateTime(value) ?? value ?? "—";
}

function buildRequestInfoBox(state: AccessRequestStatusViewState): string {
	const requestId = state.accessRequestIds.join(", ") || "—";
	const created = formatDateTime(state.createdDate) ?? "Pending...";

	return `<div id="request-info-box" class="request-info-box">
		<div class="request-info-grid">
			<div class="request-info-item">
				<div class="request-info-label">Identity</div>
				<div class="request-info-value">${escapeHtml(state.identityName)}</div>
			</div>
			<div class="request-info-item">
				<div class="request-info-label">Access item</div>
				<div class="request-info-value">${escapeHtml(formatTypeLabel(state.accessItemType))}: ${escapeHtml(state.accessItemName)}</div>
			</div>
			<div class="request-info-item">
				<div class="request-info-label">Request ID</div>
				<div class="request-info-value request-info-mono">${escapeHtml(requestId)}</div>
			</div>
			<div class="request-info-item">
				<div class="request-info-label">Created</div>
				<div id="request-created-value" class="request-info-value">${escapeHtml(created)}</div>
			</div>
		</div>
	</div>`;
}

export function buildStatusEntryHtml(status: RequestedItemStatus, capturedAt?: string): string {
	const statusErrors = formatStatusErrors(status);
	const capturedLabel = capturedAt ?? new Date().toLocaleString();
	const lastPhase = getLastAccessRequestPhase(status);

	const parts = [
		buildLastPhaseSection(lastPhase),
		`<div><strong>Captured:</strong> ${escapeHtml(capturedLabel)}</div>`,
	];

	if (statusErrors) {
		parts.push(`<div class="error-box">${escapeHtml(statusErrors)}</div>`);
	}

	parts.push(`<details class="json-details"><summary>Status JSON</summary><pre>${escapeHtml(JSON.stringify(status, null, 2))}</pre></details>`);

	return `<div class="status-entry">${parts.join("")}</div>`;
}

export function buildErrorEntryHtml(error: string): string {
	return `<div class="status-entry status-entry-error"><div class="error-box">${escapeHtml(error)}</div></div>`;
}

export function buildStatusHistoryHtml(
	statusHistory: AccessRequestStatusHistoryEntry[],
	error?: string,
): string {
	if (error && statusHistory.length === 0) {
		return buildErrorEntryHtml(error);
	}

	if (statusHistory.length === 0) {
		return `<div id="status-history-empty" class="status-history-empty">No status activity yet.</div>`;
	}

	return statusHistory
		.map(entry => buildStatusEntryHtml(entry.status, entry.capturedAt))
		.join("");
}

export function buildAccessRequestStatusHtml(state: AccessRequestStatusViewState): string {
	const nonce = getNonce();
	const title = buildTailBannerTitle(state.complete);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
	<style>
		:root {
			color: var(--vscode-foreground);
			background-color: var(--vscode-editor-background);
			font-family: var(--vscode-font-family);
			font-size: var(--vscode-font-size);
		}

		body {
			margin: 0;
			padding: 16px 20px 24px;
		}

		header {
			margin-bottom: 16px;
		}

		h1 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 600;
		}

		.request-info-box {
			margin-bottom: 16px;
			padding: 14px 16px;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 8px;
			background: linear-gradient(
				135deg,
				color-mix(in srgb, var(--vscode-editor-background) 88%, var(--vscode-textLink-foreground) 12%) 0%,
				color-mix(in srgb, var(--vscode-editor-background) 94%, var(--vscode-foreground) 6%) 100%
			);
			box-shadow: 0 1px 3px color-mix(in srgb, var(--vscode-foreground) 8%, transparent);
		}

		.request-info-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 12px 20px;
		}

		.request-info-label {
			font-size: 0.78rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--vscode-descriptionForeground);
			margin-bottom: 4px;
		}

		.request-info-value {
			font-size: 0.95rem;
			word-break: break-word;
		}

		.request-info-mono {
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 0.9rem;
		}

		.tail-banner {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 16px;
			border-radius: 6px;
			margin-bottom: 16px;
			font-weight: 600;
			font-size: 0.95rem;
		}

		.status-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.status-icon-svg {
			width: 18px;
			height: 18px;
			display: block;
		}

		.tail-spin {
			animation: tail-spin 1.1s linear infinite;
		}

		@keyframes tail-spin {
			from { transform: rotate(0deg); }
			to { transform: rotate(360deg); }
		}

		.status-icon-tailing {
			color: #9cdcfe;
		}

		.status-icon-complete {
			color: #89d185;
		}

		.status-entry-title {
			font-size: 1rem;
			font-weight: 600;
			margin-bottom: 8px;
		}

		.tail-banner.tailing {
			background: color-mix(in srgb, #3794ff 22%, var(--vscode-editor-background));
			color: #9cdcfe;
			border: 1px solid #3794ff;
		}

		.tail-banner.complete {
			background: color-mix(in srgb, #89d185 22%, var(--vscode-editor-background));
			color: #89d185;
			border: 1px solid #4ec9b0;
		}

		.panel {
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			padding: 12px 14px;
			margin-bottom: 16px;
		}

		.panel h2 {
			margin: 0 0 10px;
			font-size: 1rem;
		}

		#status-history {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.status-history-empty {
			color: var(--vscode-descriptionForeground);
			font-style: italic;
		}

		.status-entry {
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			padding: 12px 14px;
			background: color-mix(in srgb, var(--vscode-editor-background) 94%, var(--vscode-foreground) 6%);
		}

		.status-entry-error {
			border-color: var(--vscode-inputValidation-errorBorder, #be1100);
		}

		.status-entry div {
			margin-bottom: 6px;
		}

		.log-box {
			background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-foreground) 8%);
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			padding: 10px 12px;
			max-height: 320px;
			overflow: auto;
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: 0.92rem;
		}

		.log-line {
			padding: 2px 0;
			white-space: pre-wrap;
			word-break: break-word;
		}

		.log-line.muted {
			color: var(--vscode-descriptionForeground);
		}

		.error-box {
			margin-top: 6px;
			padding: 10px 12px;
			border-radius: 6px;
			background: color-mix(in srgb, var(--vscode-inputValidation-errorBackground, #5a1d1d) 80%, transparent);
			color: var(--vscode-errorForeground, #f48771);
			white-space: pre-wrap;
		}

		.json-details {
			margin-top: 8px;
		}

		.json-details pre {
			margin: 8px 0 0;
			padding: 10px 12px;
			overflow: auto;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
			background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-foreground) 8%);
		}
	</style>
</head>
<body>
	<header>
		<h1>${escapeHtml(title)}</h1>
	</header>
	${buildTailBanner(state.complete)}
	${buildRequestInfoBox(state)}
	<div class="panel">
		<h2>Status history</h2>
		<div id="status-history">
			${buildStatusHistoryHtml(state.statusHistory, state.error)}
		</div>
	</div>
	<div class="panel">
		<h2>Log</h2>
		<div id="log-box" class="log-box">
			${buildLogLines(state.logs)}
		</div>
	</div>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();

		function appendHistoryHtml(html) {
			const history = document.getElementById("status-history");
			if (!history) {
				return;
			}
			const empty = document.getElementById("status-history-empty");
			if (empty) {
				empty.remove();
			}
			history.insertAdjacentHTML("beforeend", html);
		}

		function syncStatusHistory(html) {
			const history = document.getElementById("status-history");
			if (history) {
				history.innerHTML = html;
			}
		}

		function updateRequestInfo(createdLabel) {
			const createdValue = document.getElementById("request-created-value");
			if (createdValue) {
				createdValue.textContent = createdLabel;
			}
		}

		function setTailing(bannerHtml, title) {
			const banner = document.getElementById("tail-banner");
			if (banner) {
				banner.outerHTML = bannerHtml;
			}
			document.title = title;
		}

		function appendLogLine(line) {
			const logBox = document.getElementById("log-box");
			if (!logBox) {
				return;
			}
			const muted = logBox.querySelector(".log-line.muted");
			if (muted) {
				muted.remove();
			}
			const entry = document.createElement("div");
			entry.className = "log-line";
			entry.textContent = line;
			logBox.appendChild(entry);
			logBox.scrollTop = logBox.scrollHeight;
		}

		window.addEventListener("message", (event) => {
			const message = event.data;
			if (message?.command === "appendLog" && typeof message.line === "string") {
				appendLogLine(message.line);
			}
			if (message?.command === "appendStatus" && typeof message.html === "string") {
				appendHistoryHtml(message.html);
			}
			if (message?.command === "syncStatusHistory" && typeof message.html === "string") {
				syncStatusHistory(message.html);
			}
			if (message?.command === "appendError" && typeof message.html === "string") {
				appendHistoryHtml(message.html);
			}
			if (message?.command === "updateRequestInfo" && typeof message.createdLabel === "string") {
				updateRequestInfo(message.createdLabel);
			}
			if (message?.command === "setTailing" && typeof message.bannerHtml === "string") {
				setTailing(message.bannerHtml, message.title);
			}
		});

		vscode.postMessage({ command: "ready" });
	</script>
</body>
</html>`;
}

export function formatApiError(error: unknown): string {
	if (typeof error === "object" && error !== null) {
		const anyError = error as { response?: { data?: { message?: string; detailCode?: string } }; message?: string };
		return anyError.response?.data?.message
			?? anyError.response?.data?.detailCode
			?? anyError.message
			?? String(error);
	}
	return String(error);
}
