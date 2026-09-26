import { IdentityAccessItem } from "../../models/IdentityAccessItem";
import { jsonDrawerCss, jsonDrawerMarkup, jsonDrawerScript } from "./jsonDrawerSnippet";

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

export function buildAccessTableRows(accessItems: IdentityAccessItem[]): AccessTableRow[] {
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

		.filter-field input:focus,
		.multi-select-toggle:focus {
			outline: 1px solid var(--vscode-focusBorder);
		}

		.multi-select {
			position: relative;
			min-width: 200px;
		}

		.multi-select-toggle {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			width: 100%;
			text-align: left;
			background: var(--vscode-input-background);
			color: var(--vscode-input-foreground);
			border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
			border-radius: 4px;
			padding: 4px 8px;
			font: inherit;
			cursor: pointer;
		}

		.multi-select-toggle .multi-select-label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.multi-select-toggle .caret {
			flex: none;
			font-size: 0.7rem;
			opacity: 0.8;
		}

		.multi-select-panel {
			position: absolute;
			top: calc(100% + 4px);
			left: 0;
			z-index: 5;
			min-width: 100%;
			max-width: 360px;
			max-height: 240px;
			overflow: auto;
			background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
			color: var(--vscode-editorWidget-foreground, var(--vscode-foreground));
			border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
			border-radius: 4px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
			padding: 4px 0;
		}

		.multi-select-panel[hidden] {
			display: none;
		}

		.multi-select-option {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 4px 10px;
			cursor: pointer;
		}

		.multi-select-option:hover {
			background: var(--vscode-list-hoverBackground);
		}

		.multi-select-option span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.multi-select-empty {
			padding: 6px 10px;
			color: var(--vscode-descriptionForeground);
		}

		.table-wrap {
			overflow: auto;
			scrollbar-gutter: stable;
			border: 1px solid var(--vscode-panel-border);
			border-radius: 6px;
		}

		table {
			table-layout: fixed;
			border-collapse: collapse;
			width: auto;
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
			box-sizing: border-box;
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
			box-sizing: border-box;
		}

		th.col-fixed,
		td.col-fixed {
			white-space: nowrap;
			word-break: normal;
			text-overflow: ellipsis;
		}

		th.sortable {
			cursor: pointer;
			user-select: none;
		}

		th.sortable:hover {
			background: var(--vscode-list-hoverBackground);
		}

		th.sortable .sort-indicator {
			display: inline-block;
			width: 1em;
			margin-left: 4px;
			text-align: center;
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
		${jsonDrawerCss}
	</style>
</head>
<body>
	<header>
		<h1>${escapeHtml(identityName)}</h1>
		<div class="summary" id="summary">${escapeHtml(summary)}</div>
	</header>
	<div class="toolbar">
		<button type="button" class="action-button" id="request-access-btn">Request Access</button>
		<button type="button" class="action-button secondary" id="refresh-btn">Refresh</button>
	</div>
	<div class="filters">
		<div class="filter-field multi-select">
			<label id="filter-type-label">Type</label>
			<button type="button" class="multi-select-toggle" id="type-filter-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="type-filter-panel" aria-labelledby="filter-type-label">
				<span class="multi-select-label">All</span>
				<span class="caret" aria-hidden="true">▼</span>
			</button>
			<div class="multi-select-panel" id="type-filter-panel" role="group" aria-labelledby="filter-type-label" hidden>
				<label class="multi-select-option"><input type="checkbox" value="ROLE"><span>Role</span></label>
				<label class="multi-select-option"><input type="checkbox" value="ENTITLEMENT"><span>Entitlement</span></label>
				<label class="multi-select-option"><input type="checkbox" value="ACCESS_PROFILE"><span>Access Profile</span></label>
			</div>
		</div>
		<div class="filter-field">
			<label for="filter-name">Filter name</label>
			<input type="text" id="filter-name" placeholder="Name contains...">
		</div>
		<div class="filter-field multi-select">
			<label id="filter-source-label">Source</label>
			<button type="button" class="multi-select-toggle" id="source-filter-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="source-filter-panel" aria-labelledby="filter-source-label">
				<span class="multi-select-label">All</span>
				<span class="caret" aria-hidden="true">▼</span>
			</button>
			<div class="multi-select-panel" id="source-filter-panel" role="group" aria-labelledby="filter-source-label" hidden>
				<div id="source-filter-options"></div>
			</div>
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
					<th class="sortable" data-sort-key="typeLabel"><span class="th-label">Type<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="sortable" data-sort-key="name"><span class="th-label">Name<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="sortable" data-sort-key="source"><span class="th-label">Source<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="sortable col-fixed" data-sort-key="revocable"><span class="th-label">Revocable<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="sortable col-fixed" data-sort-key="standalone"><span class="th-label">Standalone<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="sortable col-fixed" data-sort-key="removeDate"><span class="th-label">Expires<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="col-fixed"><span class="th-label">JSON</span><div class="col-resizer" aria-hidden="true"></div></th>
					<th class="col-fixed"><span class="th-label">Actions</span><div class="col-resizer" aria-hidden="true"></div></th>
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
	${jsonDrawerMarkup}
	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		let allRows = ${rowsJson};
		let totalCount = allRows.length;
		const TABLE_PAGE_SIZE = 50;
		const TYPE_OPTIONS = [
			{ value: "ROLE", label: "Role" },
			{ value: "ENTITLEMENT", label: "Entitlement" },
			{ value: "ACCESS_PROFILE", label: "Access Profile" },
		];

		const state = {
			sortKey: "typeLabel",
			sortDirection: "asc",
			selectedTypes: [],
			nameFilter: "",
			selectedSources: [],
			page: 0,
		};

		// Name and Source absorb extra space. Revocable, Standalone, Expires, JSON, and Actions
		// stay at a stable width because their values have a known format.
		const columnMinWidths = [88, 120, 100, 108, 124, 188, 64, 100];
		const columnWidths = [120, 220, 160, 112, 128, 200, 72, 108];
		const flexColumnIndexes = [1, 2];
		let columnsCustomized = false;

		${jsonDrawerScript()}

		function computeColumnWidths() {
			const widths = columnWidths.slice();
			if (columnsCustomized) {
				return widths;
			}

			const wrap = document.querySelector(".table-wrap");
			const available = wrap ? wrap.clientWidth : 0;
			if (available <= 0 || flexColumnIndexes.length === 0) {
				return widths;
			}

			const sum = widths.reduce((total, width) => total + width, 0);
			const extra = available - sum;
			if (extra > 1) {
				const share = extra / flexColumnIndexes.length;
				for (const index of flexColumnIndexes) {
					widths[index] += share;
				}
				return widths;
			}

			if (extra >= -1) {
				return widths;
			}

			const flexRoom = flexColumnIndexes.map((index) => Math.max(0, widths[index] - columnMinWidths[index]));
			const roomSum = flexRoom.reduce((total, room) => total + room, 0);
			if (roomSum <= 0) {
				return widths;
			}

			const shrink = Math.min(-extra, roomSum);
			for (let i = 0; i < flexColumnIndexes.length; i++) {
				const index = flexColumnIndexes[i];
				widths[index] -= (flexRoom[i] / roomSum) * shrink;
			}
			return widths;
		}

		function applyColumnWidths() {
			const widths = computeColumnWidths();
			const cols = document.querySelectorAll("#access-table-cols col");
			const headers = document.querySelectorAll("#access-table thead th");
			let total = 0;
			widths.forEach((width, index) => {
				const px = width + "px";
				if (cols[index]) {
					cols[index].style.width = px;
				}
				if (headers[index]) {
					headers[index].style.width = px;
					headers[index].style.minWidth = px;
					headers[index].style.maxWidth = px;
				}
				total += width;
			});
			const table = document.getElementById("access-table");
			if (table) {
				const px = total + "px";
				table.style.width = px;
				table.style.minWidth = px;
				table.style.maxWidth = px;
			}
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

					const displayed = computeColumnWidths();
					for (let i = 0; i < displayed.length; i++) {
						columnWidths[i] = displayed[i];
					}
					columnsCustomized = true;

					const startX = event.pageX;
					const startWidth = columnWidths[index];
					resizer.classList.add("active");
					document.body.classList.add("col-resizing");

					const onMouseMove = (moveEvent) => {
						const delta = moveEvent.pageX - startX;
						columnWidths[index] = Math.max(columnMinWidths[index], startWidth + delta);
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

		function observeTableWrap() {
			const wrap = document.querySelector(".table-wrap");
			if (!wrap || typeof ResizeObserver === "undefined") {
				window.addEventListener("resize", applyColumnWidths);
				return;
			}
			const observer = new ResizeObserver(() => applyColumnWidths());
			observer.observe(wrap);
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

		function matchesSelection(value, selected) {
			if (selected.length === 0) {
				return true;
			}
			return selected.includes(value);
		}

		function formatSelectionLabel(labels) {
			if (labels.length === 0) {
				return "All";
			}
			return labels.join(", ");
		}

		function setToggleLabel(toggleId, label) {
			const toggle = document.getElementById(toggleId);
			const labelNode = toggle?.querySelector(".multi-select-label");
			if (labelNode) {
				labelNode.textContent = label;
			}
		}

		function updateTypeToggleLabel() {
			const labels = TYPE_OPTIONS
				.filter((option) => state.selectedTypes.includes(option.value))
				.map((option) => option.label);
			setToggleLabel("type-filter-toggle", formatSelectionLabel(labels));
		}

		function updateSourceToggleLabel() {
			setToggleLabel("source-filter-toggle", formatSelectionLabel(state.selectedSources));
		}

		function readCheckedValues(container) {
			if (!container) {
				return [];
			}
			return [...container.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);
		}

		function collectSources() {
			return [...new Set(allRows.map((row) => row.source).filter(Boolean))].sort((a, b) =>
				String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
			);
		}

		function renderSourceOptions() {
			const sources = collectSources();
			const available = new Set(sources);
			state.selectedSources = state.selectedSources.filter((source) => available.has(source));

			const container = document.getElementById("source-filter-options");
			if (!container) {
				return;
			}

			if (sources.length === 0) {
				container.innerHTML = '<div class="multi-select-empty">No sources</div>';
			} else {
				container.innerHTML = sources.map((source) => {
					const checked = state.selectedSources.includes(source) ? " checked" : "";
					return '<label class="multi-select-option"><input type="checkbox" value="'
						+ escapeHtml(source) + '"' + checked + '><span>' + escapeHtml(source) + "</span></label>";
				}).join("");
			}

			updateSourceToggleLabel();
		}

		function closeMultiSelects() {
			for (const panel of document.querySelectorAll(".multi-select-panel")) {
				panel.hidden = true;
			}
			for (const toggle of document.querySelectorAll(".multi-select-toggle")) {
				toggle.setAttribute("aria-expanded", "false");
			}
		}

		function setRefreshing(refreshing) {
			const button = document.getElementById("refresh-btn");
			if (button instanceof HTMLButtonElement) {
				button.disabled = refreshing;
				button.textContent = refreshing ? "Refreshing..." : "Refresh";
			}
		}

		function getVisibleRows() {
			let rows = allRows.filter((row) =>
				matchesSelection(row.type, state.selectedTypes)
				&& matchesFilter(row.name, state.nameFilter)
				&& matchesSelection(row.source, state.selectedSources)
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
					<td class="col-fixed">\${escapeHtml(formatBoolean(row.revocable))}</td>
					<td class="col-fixed">\${escapeHtml(formatBoolean(row.standalone))}</td>
					<td class="col-fixed" title="\${escapeHtml(formatExpires(row.removeDate))}">\${escapeHtml(formatExpires(row.removeDate))}</td>
					<td class="col-fixed"><a href="#" class="json-link" data-access-index="\${row.index}">JSON</a></td>
					<td class="actions-cell col-fixed">
						<button type="button" class="action-button remove-button" data-access-index="\${row.index}">Revoke</button>
					</td>
				</tr>
			\`).join("");

			bindRowActions(tbody);
		}

		document.getElementById("request-access-btn")?.addEventListener("click", () => {
			vscode.postMessage({ command: "requestAccess" });
		});

		document.getElementById("refresh-btn")?.addEventListener("click", () => {
			state.page = 0;
			renderTable();
			setRefreshing(true);
			vscode.postMessage({ command: "refresh" });
		});

		document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
			state.selectedTypes = [];
			state.selectedSources = [];
			state.nameFilter = "";
			state.page = 0;

			for (const input of document.querySelectorAll("#type-filter-panel input, #source-filter-options input")) {
				if (input instanceof HTMLInputElement) {
					input.checked = false;
				}
			}

			const nameInput = document.getElementById("filter-name");
			if (nameInput instanceof HTMLInputElement) {
				nameInput.value = "";
			}

			updateTypeToggleLabel();
			updateSourceToggleLabel();
			renderTable();
		});

		document.getElementById("filter-name")?.addEventListener("input", (event) => {
			const target = event.target;
			if (!(target instanceof HTMLInputElement)) {
				return;
			}

			state.nameFilter = target.value.trim();
			state.page = 0;
			renderTable();
		});

		document.getElementById("type-filter-panel")?.addEventListener("change", () => {
			state.selectedTypes = readCheckedValues(document.getElementById("type-filter-panel"));
			updateTypeToggleLabel();
			state.page = 0;
			renderTable();
		});

		document.getElementById("source-filter-panel")?.addEventListener("change", () => {
			state.selectedSources = readCheckedValues(document.getElementById("source-filter-options"));
			updateSourceToggleLabel();
			state.page = 0;
			renderTable();
		});

		for (const toggle of document.querySelectorAll(".multi-select-toggle")) {
			toggle.addEventListener("click", (event) => {
				event.stopPropagation();
				const panelId = toggle.getAttribute("aria-controls");
				const panel = panelId ? document.getElementById(panelId) : null;
				if (!panel) {
					return;
				}

				const willOpen = panel.hidden;
				closeMultiSelects();
				panel.hidden = !willOpen;
				toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
			});
		}

		document.addEventListener("click", (event) => {
			const target = event.target;
			if (target instanceof Element && target.closest(".multi-select")) {
				return;
			}
			closeMultiSelects();
		});

		document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				closeMultiSelects();
			}
		});

		window.addEventListener("message", (event) => {
			const message = event.data;
			if (!message || typeof message !== "object") {
				return;
			}

			if (message.command === "accessLoaded" && Array.isArray(message.rows)) {
				allRows = message.rows;
				totalCount = allRows.length;
				state.page = 0;
				setRefreshing(false);
				renderSourceOptions();
				renderTable();
				return;
			}

			if (message.command === "showAccessJson" && typeof message.json === "string") {
				openJsonDrawer(typeof message.title === "string" ? message.title : "JSON", message.json);
				return;
			}

			if (message.command === "refreshFailed") {
				setRefreshing(false);
			}
		});

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
		initJsonDrawer();
		observeTableWrap();
		renderSourceOptions();
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
