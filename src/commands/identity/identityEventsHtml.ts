import { EventDocumentV2025 } from "sailpoint-api-client";
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

export interface EventTableRow {
    index: number;
    name: string;
    action: string;
    actor: string;
    target: string;
    status: string;
    created: string;
}

export function buildEventTableRows(events: EventDocumentV2025[]): EventTableRow[] {
    return events.map((event, index) => ({
        index,
        name: event.name ?? "",
        action: event.action ?? "",
        actor: event.actor?.name ?? "",
        target: event.target?.name ?? "",
        status: event.status ?? "",
        created: event.created ?? "",
    }));
}

export function buildEventsTableHtml(
    identityName: string,
    events: EventDocumentV2025[],
    total?: number
): string {
    const nonce = getNonce();
    const tableRows = buildEventTableRows(events);
    const rowsJson = JSON.stringify(tableRows).replace(/</g, "\\u003c");
    const apiTotal = typeof total === "number" && Number.isFinite(total) ? String(total) : "null";

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
            align-items: flex-end;
        }

        .filter-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 160px;
        }

        .filter-field.search-field {
            min-width: 220px;
            flex: 1;
        }

        .filter-field label {
            font-size: 0.82rem;
            color: var(--vscode-descriptionForeground);
        }

        .filter-field input,
        .filter-field select {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
            border-radius: 4px;
            padding: 4px 8px;
            font: inherit;
        }

        .filter-field select {
            background: var(--vscode-dropdown-background, var(--vscode-input-background));
            color: var(--vscode-dropdown-foreground, var(--vscode-input-foreground));
            border-color: var(--vscode-dropdown-border, var(--vscode-input-border, var(--vscode-panel-border)));
        }

        .filter-field input:focus,
        .filter-field select:focus {
            outline: 1px solid var(--vscode-focusBorder);
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
            max-width: calc(100% - 10px);
            overflow: hidden;
            text-overflow: ellipsis;
            vertical-align: middle;
        }

        th .col-resizer {
            position: absolute;
            top: 0;
            right: 0;
            width: 8px;
            height: 100%;
            cursor: col-resize;
            user-select: none;
            touch-action: none;
            z-index: 2;
        }

        th .col-resizer:hover,
        body.col-resizing th .col-resizer.active {
            background: var(--vscode-focusBorder);
        }

        body.col-resizing {
            cursor: col-resize;
            user-select: none;
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
        <div class="summary" id="summary"></div>
    </header>
    <div class="toolbar">
        <button type="button" class="action-button" id="refresh-btn">Refresh</button>
    </div>
    <div class="filters">
        <div class="filter-field search-field">
            <label for="search-name-action">Search</label>
            <input type="search" id="search-name-action" placeholder="Name or action">
        </div>
        <div class="filter-field">
            <label for="filter-action">Action</label>
            <select id="filter-action"></select>
        </div>
        <div class="filter-field">
            <label for="filter-status">Status</label>
            <select id="filter-status"></select>
        </div>
        <button type="button" class="action-button secondary" id="clear-filters-btn">Clear filters</button>
    </div>
    <div class="table-wrap">
        <table id="events-table">
            <colgroup id="events-table-cols">
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
                    <th class="sortable" data-sort-key="name"><span class="th-label">Name<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th class="sortable" data-sort-key="action"><span class="th-label">Action<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th><span class="th-label">Actor</span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th><span class="th-label">Target</span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th class="sortable col-fixed" data-sort-key="status"><span class="th-label">Status<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th class="col-fixed"><span class="th-label">Details</span><div class="col-resizer" aria-hidden="true"></div></th>
                    <th class="sortable col-fixed" data-sort-key="created"><span class="th-label">Created<span class="sort-indicator"></span></span><div class="col-resizer" aria-hidden="true"></div></th>
                </tr>
            </thead>
            <tbody id="events-table-body"></tbody>
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
        let apiTotal = ${apiTotal};
        const TABLE_PAGE_SIZE = 50;

        const state = {
            sortKey: "created",
            sortDirection: "desc",
            search: "",
            actionFilter: "",
            statusFilter: "",
            page: 0,
        };

        // Name, Action, Actor, and Target absorb extra space.
        // Status, Details, and Created keep a stable width: their values have a known format.
        const columnMinWidths = [100, 90, 90, 90, 104, 84, 200];
        const columnWidths = [220, 140, 150, 150, 112, 88, 210];
        const flexColumnIndexes = [0, 1, 2, 3];
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
            const cols = document.querySelectorAll("#events-table-cols col");
            const headers = document.querySelectorAll("#events-table thead th");
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
            const table = document.getElementById("events-table");
            if (table) {
                const px = total + "px";
                table.style.width = px;
                table.style.minWidth = px;
                table.style.maxWidth = px;
            }
        }

        function initColumnResizers() {
            const headers = document.querySelectorAll("#events-table thead th");
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
            return String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        function formatCreated(created) {
            if (!created) {
                return "";
            }
            const date = new Date(created);
            if (Number.isNaN(date.getTime())) {
                return created;
            }
            return date.toLocaleString();
        }

        function statusClass(status) {
            const normalized = String(status ?? "").toUpperCase();
            if (normalized === "PASSED" || normalized === "SUCCESS") {
                return "status-success";
            }
            if (normalized === "FAILED") {
                return "status-error";
            }
            return "status-default";
        }

        function matchesText(value, filterText) {
            if (!filterText) {
                return true;
            }
            return String(value ?? "").toLowerCase().includes(filterText.toLowerCase());
        }

        function matchesSearch(row, searchText) {
            if (!searchText) {
                return true;
            }
            return matchesText(row.name, searchText) || matchesText(row.action, searchText);
        }

        function compareCreated(a, b, direction) {
            const aTime = a.created ? Date.parse(a.created) : Number.NaN;
            const bTime = b.created ? Date.parse(b.created) : Number.NaN;
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
            const result = aTime - bTime;
            return direction === "asc" ? result : -result;
        }

        function compareRows(a, b) {
            if (state.sortKey === "created") {
                return compareCreated(a, b, state.sortDirection);
            }

            const left = String(a[state.sortKey] ?? "");
            const right = String(b[state.sortKey] ?? "");
            const result = left.localeCompare(right, undefined, { sensitivity: "base" });
            return state.sortDirection === "asc" ? result : -result;
        }

        function matchesSelected(value, selected) {
            if (!selected) {
                return true;
            }
            return String(value ?? "") === selected;
        }

        function getVisibleRows() {
            const rows = allRows.filter((row) =>
                matchesSearch(row, state.search)
                && matchesSelected(row.action, state.actionFilter)
                && matchesSelected(row.status, state.statusFilter)
            );
            rows.sort(compareRows);
            return rows;
        }

        function updateSummary(filteredCount) {
            const summary = document.getElementById("summary");
            if (!summary) {
                return;
            }

            const loaded = allRows.length;
            const truncated = typeof apiTotal === "number" && apiTotal > loaded;
            if (filteredCount === loaded) {
                summary.textContent = truncated
                    ? "Showing " + loaded + " of " + apiTotal + " events"
                    : loaded + " event" + (loaded === 1 ? "" : "s");
                return;
            }

            let text = filteredCount + " of " + loaded + " events match filters";
            if (truncated) {
                text += " (" + apiTotal + " total)";
            }
            summary.textContent = text;
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

        function fillSelect(id, values, selectedValue) {
            const select = document.getElementById(id);
            if (!(select instanceof HTMLSelectElement)) {
                return "";
            }

            const unique = [...new Set(values.filter(Boolean))].sort((a, b) =>
                String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
            );
            const options = ['<option value="">All</option>'].concat(
                unique.map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + "</option>")
            );
            select.innerHTML = options.join("");
            select.value = unique.includes(selectedValue) ? selectedValue : "";
            return select.value;
        }

        function updateFilterDropdowns() {
            state.actionFilter = fillSelect("filter-action", allRows.map((row) => row.action), state.actionFilter);
            state.statusFilter = fillSelect("filter-status", allRows.map((row) => row.status), state.statusFilter);
        }

        function setRefreshing(refreshing) {
            const button = document.getElementById("refresh-btn");
            if (button instanceof HTMLButtonElement) {
                button.disabled = refreshing;
                button.textContent = refreshing ? "Refreshing..." : "Refresh";
            }
        }

        function bindRowActions(container) {
            for (const link of container.querySelectorAll(".json-link")) {
                link.addEventListener("click", (event) => {
                    event.preventDefault();
                    const index = Number(link.getAttribute("data-event-index"));
                    if (!Number.isNaN(index)) {
                        vscode.postMessage({ command: "openEventJson", index });
                    }
                });
            }
        }

        function renderTable() {
            const tbody = document.getElementById("events-table-body");
            if (!tbody) {
                return;
            }

            const filteredRows = getVisibleRows();
            updateSummary(filteredRows.length);
            updateSortIndicators();
            updatePaginationControls(filteredRows.length);

            if (filteredRows.length === 0) {
                const message = allRows.length === 0
                    ? "No events found for this identity."
                    : "No events match the current filters.";
                tbody.innerHTML = '<tr class="empty-row"><td colspan="7">' + message + "</td></tr>";
                return;
            }

            const pageStart = state.page * TABLE_PAGE_SIZE;
            const rows = filteredRows.slice(pageStart, pageStart + TABLE_PAGE_SIZE);
            tbody.innerHTML = rows.map((row) => \`
                <tr>
                    <td>\${escapeHtml(row.name)}</td>
                    <td>\${escapeHtml(row.action)}</td>
                    <td>\${escapeHtml(row.actor)}</td>
                    <td>\${escapeHtml(row.target)}</td>
                    <td class="col-fixed" title="\${escapeHtml(row.status)}"><span class="\${statusClass(row.status)}">\${escapeHtml(row.status)}</span></td>
                    <td class="col-fixed"><a href="#" class="json-link" data-event-index="\${row.index}">JSON</a></td>
                    <td class="col-fixed" title="\${escapeHtml(formatCreated(row.created))}">\${escapeHtml(formatCreated(row.created))}</td>
                </tr>
            \`).join("");

            bindRowActions(tbody);
        }

        document.getElementById("refresh-btn")?.addEventListener("click", () => {
            state.page = 0;
            renderTable();
            setRefreshing(true);
            vscode.postMessage({ command: "refresh" });
        });

        document.getElementById("clear-filters-btn")?.addEventListener("click", () => {
            state.search = "";
            state.actionFilter = "";
            state.statusFilter = "";
            state.page = 0;

            const searchInput = document.getElementById("search-name-action");
            const actionSelect = document.getElementById("filter-action");
            const statusSelect = document.getElementById("filter-status");
            if (searchInput instanceof HTMLInputElement) {
                searchInput.value = "";
            }
            if (actionSelect instanceof HTMLSelectElement) {
                actionSelect.value = "";
            }
            if (statusSelect instanceof HTMLSelectElement) {
                statusSelect.value = "";
            }
            renderTable();
        });

        document.getElementById("search-name-action")?.addEventListener("input", (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) {
                return;
            }

            state.search = target.value.trim();
            state.page = 0;
            renderTable();
        });

        for (const select of [
            document.getElementById("filter-action"),
            document.getElementById("filter-status"),
        ]) {
            select?.addEventListener("change", (event) => {
                const target = event.target;
                if (!(target instanceof HTMLSelectElement)) {
                    return;
                }

                if (target.id === "filter-action") {
                    state.actionFilter = target.value;
                } else if (target.id === "filter-status") {
                    state.statusFilter = target.value;
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
                    state.sortDirection = sortKey === "created" ? "desc" : "asc";
                }

                state.page = 0;
                renderTable();
            });
        }

        window.addEventListener("message", (event) => {
            const message = event.data;
            if (!message || typeof message !== "object") {
                return;
            }

            if (message.command === "eventsLoaded" && Array.isArray(message.rows)) {
                allRows = message.rows;
                apiTotal = typeof message.total === "number" ? message.total : null;
                state.page = 0;
                setRefreshing(false);
                updateFilterDropdowns();
                renderTable();
                return;
            }

            if (message.command === "showEventJson" && typeof message.json === "string") {
                openJsonDrawer(typeof message.title === "string" ? message.title : "Event JSON", message.json);
                return;
            }

            if (message.command === "refreshFailed") {
                setRefreshing(false);
            }
        });

        applyColumnWidths();
        initColumnResizers();
        initJsonDrawer();
        observeTableWrap();
        updateFilterDropdowns();
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
<body>Loading events for ${escapeHtml(identityName)}...</body>
</html>`;
}
