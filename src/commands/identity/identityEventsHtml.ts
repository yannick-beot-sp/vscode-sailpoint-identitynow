import { EventDocumentV2025 } from 'sailpoint-api-client';
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

function formatCreated(created?: string | null): string {
    if (!created) {
        return "";
    }
    const date = new Date(created);
    if (Number.isNaN(date.getTime())) {
        return created;
    }
    return date.toLocaleString();
}

function getStatusClass(status?: string): string {
    const normalized = (status ?? "").toUpperCase();
    if (normalized === "PASSED" || normalized === "SUCCESS") {
        return "status-success";
    }
    if (normalized === "FAILED") {
        return "status-error";
    }
    return "status-default";
}

function buildStatusCell(status?: string): string {
    const label = status ?? "";
    return `<span class="${getStatusClass(status)}">${escapeHtml(label)}</span>`;
}

function buildEventRow(event: EventDocumentV2025, index: number): string {
    return `<tr>
        <td>${escapeHtml(event.name ?? "")}</td>
        <td>${escapeHtml(event.action ?? "")}</td>
        <td>${escapeHtml(event.actor?.name ?? "")}</td>
        <td>${escapeHtml(event.target?.name ?? "")}</td>
        <td>${buildStatusCell(event.status)}</td>
        <td><a href="#" class="json-link" data-event-index="${index}">JSON</a></td>
        <td>${escapeHtml(formatCreated(event.created))}</td>
    </tr>`;
}

export function buildEventsTableHtml(
    identityName: string,
    events: EventDocumentV2025[],
    total?: number
): string {
    const nonce = getNonce();
    const summary = total !== undefined && total > events.length
        ? `Showing ${events.length} of ${total} events`
        : `${events.length} event${events.length === 1 ? "" : "s"}`;

    const rows = events.length > 0
        ? events.map((event, index) => buildEventRow(event, index)).join("")
        : `<tr class="empty-row"><td colspan="7">No events found for this identity.</td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Events: ${escapeHtml(identityName)}</title>
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

        .status-success {
            color: var(--vscode-testing-iconPassed, #73c991);
            font-weight: 600;
        }

        .status-error {
            color: var(--vscode-errorForeground, #f48771);
            font-weight: 600;
        }

        .status-default {
            color: inherit;
            font-weight: inherit;
        }
    </style>
</head>
<body>
    <header>
        <h1>${escapeHtml(identityName)}</h1>
        <div class="summary">${escapeHtml(summary)}</div>
    </header>
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        for (const link of document.querySelectorAll(".json-link")) {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const index = Number(link.getAttribute("data-event-index"));
                if (!Number.isNaN(index)) {
                    vscode.postMessage({ command: "openEventJson", index });
                }
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
<body>Loading events for ${escapeHtml(identityName)}...</body>
</html>`;
}
