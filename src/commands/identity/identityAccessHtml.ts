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

interface AccessTableRow {
	index: number;
	type: IdentityAccessItem["type"];
	typeLabel: string;
	name: string;
	source: string;
	description: string;
	revocable?: boolean;
	standalone?: boolean;
	removeDate?: string;
}

function buildAccessTableRows(accessItems: IdentityAccessItem[]): AccessTableRow[] {
	return accessItems.map((item, index) => ({
		index,
		type: item.type,
		typeLabel: formatTypeLabel(item.type),
		name: item.displayName ?? item.name ?? item.id,
		source: item.sourceName ?? "",
		description: item.description ?? "",
		revocable: item.revocable,
		standalone: item.standalone,
		removeDate: item.removeDate,
	}));
}

export function buildAccessTableHtml(
	identityName: string,
	accessItems: IdentityAccessItem[],
): string {
	const nonce = getNonce();
	const tableRows = buildAccessTableRows(accessItems);
	const summary = `${accessItems.length} access item${accessItems.length === 1 ? "" : "s"}`;
	const rowsJson = JSON.stringify(tableRows).replace(/</g, "\\u003c");

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
			flex-wrap: wrap;
			gap: 8px;
			margin-bottom: 12px;
			align-items: center;
		}

		.filters {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-bottom: 16px;
			align-items: center;
		}

		.filter-field {
			display: flex;
			flex-direction: column;
			gap: 4px;
			min-width: 160px;
		}

		.filter-field label {
			font-size: 0.82rem;
			color: var(--vscode-descriptionForeground);
		}

		.filter-field input {
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
			border-radius: 4px;
			padding: 4px 8px;
			font: inherit;
		}

		.filter-field input:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}

		.table-wrap {
			overflow: auto;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
		}

		table {
			table-layout: fixed;
			width: max-content;
			min-width: 100%;
			border-collapse: collapse;
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
			overflow: hidden;
		}

		th .th-label {
			display: inline-block;
			max-width: calc(100% - 8px);
			overflow: hidden;
			text-overflow: ellipsis;
			vertical-align: middle;
		}

		th .col-resizer {
			position: absolute;
			top: 0;
			right: 0;
			width: 6px;
			height: 100%;
			cursor: col-resize;
			user-select: none;
			touch-action: none;
		}

		th .col-resizer:hover,
		body.col-resizing th .col-resizer.active {
			background: var(--vscode-focusBorder);
		}

		body.col-resizing {
			cursor: col-resize;
			user-select: none;
		}

		tbody td {
			padding: 8px 12px;
			border-bottom: 1px solid var(--vscode-panel-border);
			vertical-align: top;
			word-break: break-word;
			overflow: hidden;
		}

		th.sortable {
			cursor: pointer;
			user-select: none;
		}

		th.sortable:hover {
			background: var(--vscode-list-hoverBackground);
		}

		th.sortable .sort-indicator {
			margin-left: 4px;
			opacity: 0.85;
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

		.action-button.secondary {
			background: var(--vscode-button-secondaryBackground);
			color: var(--vscode-button-secondaryForeground);
		}

		.action-button.secondary:hover {
			background: var(--vscode-button-secondaryHoverBackground);
		}

		.pagination {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-top: 12px;
		}

		.pagination-info {
			color: var(--vscode-descriptionForeground);
			font-size: 0.92rem;
		}
	</style>
</head>
<body>
	<header>
		<h1>${escapeHtml(identityName)}</h1>
		<div class="summary" id="summary">${escapeHtml(summary)}</div>
	</header>
	<div class="toolbar">
		<button type="button" class="action-button" id="request-access-btn">Request Access</button>
	</div>
	<div class="filters">
		<div class="filter-field">
			<label for="filter-type">Filter type</label>
			<input type="text" id="filter-type" placeholder="Role, Entitlement...">
		</div>
		<div class="filter-field">
			<label for="filter-name">Filter name</label>
			<input type="text" id="filter-name" placeholder="Name contains...">
		</div>
		<div class="filter-field">
			<label for="filter-source">Filter source</label>
			<input type="text" id="filter-source" placeholder="Source contains...">
		</div>
		<button type="button" class="action-button secondary" id="clear-filters-btn">Clear filters</button>
	</div>
	<div class="table-wrap">
		<table id="access-table">
			<colgroup id="access-table-cols">
				<col>
				<col>
				<col>
				<col>
				<col>
				<col>
				<col>
				<col>
			</colgroup>
			<thead>
				<tr>
					<th class="sortable" data-sort-key="typeLabel"><span class="th-label">Type<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th class="sortable" data-sort-key="name"><span class="th-label">Name<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th class="sortable" data-sort-key="source"><span class="th-label">Source<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th class="sortable" data-sort-key="revocable"><span class="th-label">Revocable<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th class="sortable" data-sort-key="standalone"><span class="th-label">Standalone<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th class="sortable" data-sort-key="removeDate"><span class="th-label">Expires<span class="sort-indicator"></span></span><div class="col-resizer"></div></th>
					<th><span class="th-label">JSON</span><div class="col-resizer"></div></th>
					<th><span class="th-label">Actions</span><div class="col-resizer"></div></th>
				</tr>
			</thead>
			<tbody id="access-table-body"></tbody>
		</table>
	</div>
	<div class="pagination">
		<button type="button" class="action-button secondary" id="prev-page-btn">Previous</button>
		<span class="pagination-info" id="page-info">Page 1 of 1</span>
		<button type="button" class="action-button secondary" id="next-page-btn">Next</button>
	</div>
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const allRows = ${rowsJson};
		const totalCount = allRows.length;
		const TABLE_PAGE_SIZE = 50;

		const state = {
			sortKey: "typeLabel",
			sortDirection: "asc",
			typeFilter: "",
			nameFilter: "",
			sourceFilter: "",
			page: 0,
		};

		const columnWidths = [100, 180, 140, 90, 95, 140, 55, 90];
		const MIN_COLUMN_WIDTH = 48;

		function applyColumnWidths() {
			const cols = document.querySelectorAll("#access-table-cols col");
			cols.forEach((col, index) => {
				col.style.width = columnWidths[index] + "px";
			});
		}

		function initColumnResizers() {
			const headers = document.querySelectorAll("#access-table thead th");

			headers.forEach((header, index) => {
				const resizer = header.querySelector(".col-resizer");
				if (!resizer) {
					return;
				}

				resizer.addEventListener("mousedown", (event) => {
					event.preventDefault();
					event.stopPropagation();

					const startX = event.pageX;
					const startWidth = columnWidths[index];
					resizer.classList.add("active");
					document.body.classList.add("col-resizing");

					const onMouseMove = (moveEvent) => {
						const delta = moveEvent.pageX - startX;
						columnWidths[index] = Math.max(MIN_COLUMN_WIDTH, startWidth + delta);
						applyColumnWidths();
					};

					const onMouseUp = () => {
						resizer.classList.remove("active");
						document.body.classList.remove("col-resizing");
						document.removeEventListener("mousemove", onMouseMove);
						document.removeEventListener("mouseup", onMouseUp);
					};

					document.addEventListener("mousemove", onMouseMove);
					document.addEventListener("mouseup", onMouseUp);
				});
			});
		}

		function escapeHtml(value) {
			return String(value)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#39;");
		}

		function formatBoolean(value) {
			if (value === undefined) {
				return "";
			}
			return value ? "Yes" : "No";
		}

		function formatExpires(removeDate) {
			if (!removeDate) {
				return "";
			}
			const date = new Date(removeDate);
			if (Number.isNaN(date.getTime())) {
				return removeDate;
			}
			return date.toLocaleString();
		}

		function compareBoolean(a, b) {
			const rank = (value) => {
				if (value === true) {
					return 0;
				}
				if (value === false) {
					return 1;
				}
				return 2;
			};
			return rank(a) - rank(b);
		}

		function compareValues(a, b, sortKey) {
			if (sortKey === "revocable" || sortKey === "standalone") {
				return compareBoolean(a[sortKey], b[sortKey]);
			}

			if (sortKey === "removeDate") {
				const aTime = a.removeDate ? Date.parse(a.removeDate) : Number.NaN;
				const bTime = b.removeDate ? Date.parse(b.removeDate) : Number.NaN;
				const aValid = !Number.isNaN(aTime);
				const bValid = !Number.isNaN(bTime);
				if (!aValid && !bValid) {
					return 0;
				}
				if (!aValid) {
					return 1;
				}
				if (!bValid) {
					return -1;
				}
				return aTime - bTime;
			}

			const left = String(a[sortKey] ?? "");
			const right = String(b[sortKey] ?? "");
			return left.localeCompare(right, undefined, { sensitivity: "base" });
		}

		function matchesFilter(value, filterText) {
			if (!filterText) {
				return true;
			}
			return value.toLowerCase().includes(filterText.toLowerCase());
		}

		function matchesTypeFilter(row, filterText) {
			if (!filterText) {
				return true;
			}
			return matchesFilter(row.typeLabel, filterText) || matchesFilter(row.type, filterText);
		}

		function getVisibleRows() {
			let rows = allRows.filter((row) =>
				matchesTypeFilter(row, state.typeFilter)
				&& matchesFilter(row.name, state.nameFilter)
				&& matchesFilter(row.source, state.sourceFilter)
			);

			rows = rows.slice().sort((a, b) => {
				const result = compareValues(a, b, state.sortKey);
				return state.sortDirection === "asc" ? result : -result;
			});

			return rows;
		}

		function updateSummary(filteredCount) {
			const summary = document.getElementById("summary");
			if (!summary) {
				return;
			}

			if (filteredCount === totalCount) {
				summary.textContent = totalCount + " access item" + (totalCount === 1 ? "" : "s");
				return;
			}

			summary.textContent = filteredCount + " of " + totalCount + " access items match filters";
		}

		function updatePaginationControls(filteredCount) {
			const totalPages = Math.max(1, Math.ceil(filteredCount / TABLE_PAGE_SIZE));
			if (state.page >= totalPages) {
				state.page = totalPages - 1;
			}
			if (state.page < 0) {
				state.page = 0;
			}

			const pageInfo = document.getElementById("page-info");
			const prevButton = document.getElementById("prev-page-btn");
			const nextButton = document.getElementById("next-page-btn");

			if (pageInfo) {
				if (filteredCount === 0) {
					pageInfo.textContent = "No rows";
				} else {
					const start = state.page * TABLE_PAGE_SIZE + 1;
					const end = Math.min(filteredCount, (state.page + 1) * TABLE_PAGE_SIZE);
					pageInfo.textContent = "Page " + (state.page + 1) + " of " + totalPages + " (" + start + "-" + end + " of " + filteredCount + ")";
				}
			}

			if (prevButton instanceof HTMLButtonElement) {
				prevButton.disabled = state.page <= 0 || filteredCount === 0;
			}

			if (nextButton instanceof HTMLButtonElement) {
				nextButton.disabled = state.page >= totalPages - 1 || filteredCount === 0;
			}
		}

		function updateSortIndicators() {
			for (const header of document.querySelectorAll("th.sortable")) {
				const indicator = header.querySelector(".sort-indicator");
				if (!indicator) {
					continue;
				}

				if (header.getAttribute("data-sort-key") === state.sortKey) {
					indicator.textContent = state.sortDirection === "asc" ? "▲" : "▼";
				} else {
					indicator.textContent = "";
				}
			}
		}

		function bindRowActions(container) {
			for (const link of container.querySelectorAll(".json-link")) {
				link.addEventListener("click", (event) => {
					event.preventDefault();
					const index = Number(link.getAttribute("data-access-index"));
					if (!Number.isNaN(index)) {
						vscode.postMessage({ command: "openAccessJson", index });
					}
				});
			}

			for (const button of container.querySelectorAll(".remove-button")) {
				button.addEventListener("click", () => {
					const index = Number(button.getAttribute("data-access-index"));
					if (Number.isNaN(index)) {
						return;
					}
					vscode.postMessage({ command: "requestRemoval", index });
				});
			}
		}

		function renderTable() {
			const tbody = document.getElementById("access-table-body");
			if (!tbody) {
				return;
			}

			const filteredRows = getVisibleRows();
			updateSummary(filteredRows.length);
			updateSortIndicators();
			updatePaginationControls(filteredRows.length);

			if (filteredRows.length === 0) {
				tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No access items match the current filters.</td></tr>';
				return;
			}

			const pageStart = state.page * TABLE_PAGE_SIZE;
			const rows = filteredRows.slice(pageStart, pageStart + TABLE_PAGE_SIZE);

			tbody.innerHTML = rows.map((row) => \`
				<tr>
					<td>\${escapeHtml(row.typeLabel)}</td>
					<td>\${escapeHtml(row.name)}</td>
					<td>\${escapeHtml(row.source)}</td>
					<td>\${escapeHtml(formatBoolean(row.revocable))}</td>
					<td>\${escapeHtml(formatBoolean(row.standalone))}</td>
					<td>\${escapeHtml(formatExpires(row.removeDate))}</td>
					<td><a href="#" class="json-link" data-access-index="\${row.index}">JSON</a></td>
					<td class="actions-cell">
						<button type="button" class="action-button remove-button" data-access-index="\${row.index}">Revoke</button>
					</td>
				</tr>
			\`).join("");

			bindRowActions(tbody);
		}

		document.getElementById("request-access-btn")?.addEventListener("click", () => {
			vscode.postMessage({ command: "requestAccess" });
		});

		document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
			state.typeFilter = "";
			state.nameFilter = "";
			state.sourceFilter = "";
			state.page = 0;
			const typeInput = document.getElementById("filter-type");
			const nameInput = document.getElementById("filter-name");
			const sourceInput = document.getElementById("filter-source");
			if (typeInput instanceof HTMLInputElement) {
				typeInput.value = "";
			}
			if (nameInput instanceof HTMLInputElement) {
				nameInput.value = "";
			}
			if (sourceInput instanceof HTMLInputElement) {
				sourceInput.value = "";
			}
			renderTable();
		});

		for (const input of [
			document.getElementById("filter-type"),
			document.getElementById("filter-name"),
			document.getElementById("filter-source"),
		]) {
			input?.addEventListener("input", (event) => {
				const target = event.target;
				if (!(target instanceof HTMLInputElement)) {
					return;
				}

				if (target.id === "filter-type") {
					state.typeFilter = target.value.trim();
				} else if (target.id === "filter-name") {
					state.nameFilter = target.value.trim();
				} else if (target.id === "filter-source") {
					state.sourceFilter = target.value.trim();
				}

				state.page = 0;
				renderTable();
			});
		}

		document.getElementById("prev-page-btn")?.addEventListener("click", () => {
			if (state.page > 0) {
				state.page -= 1;
				renderTable();
			}
		});

		document.getElementById("next-page-btn")?.addEventListener("click", () => {
			state.page += 1;
			renderTable();
		});

		for (const header of document.querySelectorAll("th.sortable")) {
			header.addEventListener("click", (event) => {
				if (event.target instanceof Element && event.target.closest(".col-resizer")) {
					return;
				}

				const sortKey = header.getAttribute("data-sort-key");
				if (!sortKey) {
					return;
				}

				if (state.sortKey === sortKey) {
					state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
				} else {
					state.sortKey = sortKey;
					state.sortDirection = "asc";
				}

				state.page = 0;
				renderTable();
			});
		}

		applyColumnWidths();
		initColumnResizers();
		renderTable();
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
