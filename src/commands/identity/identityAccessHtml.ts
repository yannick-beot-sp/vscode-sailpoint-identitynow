import { IdentityAccessItem } from "../../models/IdentityAccessItem";

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

function formatTypeLabel(type: IdentityAccessItem["type"]): string {
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

function formatExpires(removeDate?: string): string {
	if (!removeDate) {
		return "";
	}
	const date = new Date(removeDate);
	if (Number.isNaN(date.getTime())) {
		return removeDate;
	}
	return date.toLocaleString();
}

function buildAccessRow(item: IdentityAccessItem, index: number): string {
	const name = item.displayName ?? item.name ?? item.id;
	return `<tr>
		<td>${escapeHtml(formatTypeLabel(item.type))}</td>
		<td>${escapeHtml(name)}</td>
		<td>${escapeHtml(item.sourceName ?? "")}</td>
		<td>${escapeHtml(item.description ?? "")}</td>
		<td>${escapeHtml(formatExpires(item.removeDate))}</td>
		<td><a href="#" class="json-link" data-access-index="${index}">JSON</a></td>
		<td class="actions-cell">
			<button type="button" class="action-button remove-button" data-access-index="${index}">Request removal</button>
		</td>
	</tr>`;
}

export function buildAccessTableHtml(
	identityName: string,
	accessItems: IdentityAccessItem[],
): string {
	const nonce = getNonce();
	const summary = `${accessItems.length} access item${accessItems.length === 1 ? "" : "s"}`;

	const rows = accessItems.length > 0
		? accessItems.map((item, index) => buildAccessRow(item, index)).join("")
		: `<tr class="empty-row"><td colspan="7">No access found for this identity.</td></tr>`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Access: ${escapeHtml(identityName)}</title>
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
			margin: 0 0 6px;
			font-size: 1.25rem;
			font-weight: 600;
		}

		.summary {
			color: var(--vscode-descriptionForeground);
			font-size: 0.92rem;
		}

		.toolbar {
			display: flex;
			gap: 8px;
			margin-bottom: 16px;
		}

		.table-wrap {
			overflow: auto;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
		}

		table {
			width: 100%;
			border-collapse: collapse;
			min-width: 980px;
		}

		thead th {
			position: sticky;
			top: 0;
			z-index: 1;
			text-align: left;
			padding: 10px 12px;
			background: var(--vscode-editor-inactiveSelectionBackground);
			border-bottom: 1px solid var(--vscode-panel-border);
			font-weight: 600;
			white-space: nowrap;
		}

		tbody td {
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
			vertical-align: top;
			word-break: break-word;
		}

		tbody tr:nth-child(even) {
			background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-foreground) 8%);
		}

		tbody tr:hover {
			background: var(--vscode-list-hoverBackground);
		}

		.empty-row td {
			text-align: center;
			padding: 24px 12px;
			color: var(--vscode-descriptionForeground);
		}

		.json-link {
			color: var(--vscode-textLink-foreground);
			text-decoration: none;
			font-weight: 500;
			white-space: nowrap;
		}

		.json-link:hover {
			color: var(--vscode-textLink-activeForeground);
			text-decoration: underline;
		}

		.actions-cell {
			white-space: nowrap;
		}

		.action-button {
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			padding: 4px 10px;
			cursor: pointer;
			font: inherit;
		}

		.action-button:hover {
			background: var(--vscode-button-hoverBackground);
		}

		.action-button:disabled {
			opacity: 0.6;
			cursor: default;
		}
	</style>
</head>
<body>
	<header>
		<h1>${escapeHtml(identityName)}</h1>
		<div class="summary">${escapeHtml(summary)}</div>
	</header>
	<div class="toolbar">
		<button type="button" class="action-button" id="request-access-btn">Request Access</button>
	</div>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Type</th>
					<th>Name</th>
					<th>Source</th>
					<th>Description</th>
					<th>Expires</th>
					<th>JSON</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				${rows}
			</tbody>
		</table>
	</div>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();

		document.getElementById("request-access-btn")?.addEventListener("click", () => {
			vscode.postMessage({ command: "requestAccess" });
		});

		for (const link of document.querySelectorAll(".json-link")) {
			link.addEventListener("click", (event) => {
				event.preventDefault();
				const index = Number(link.getAttribute("data-access-index"));
				if (!Number.isNaN(index)) {
					vscode.postMessage({ command: "openAccessJson", index });
				}
			});
		}

		for (const button of document.querySelectorAll(".remove-button")) {
			button.addEventListener("click", () => {
				const index = Number(button.getAttribute("data-access-index"));
				if (Number.isNaN(index)) {
					return;
				}
				vscode.postMessage({ command: "requestRemoval", index });
			});
		}
	</script>
</body>
</html>`;
}

export function buildLoadingHtml(identityName: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
	<style>
		body {
			margin: 0;
			padding: 24px;
			color: var(--vscode-foreground);
			background: var(--vscode-editor-background);
			font-family: var(--vscode-font-family);
		}
	</style>
</head>
<body>Loading access for ${escapeHtml(identityName)}...</body>
</html>`;
}
