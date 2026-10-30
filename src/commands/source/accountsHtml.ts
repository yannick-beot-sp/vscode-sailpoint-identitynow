export interface AccountsSchemaAttribute {
	name: string;
	type: string;
	multiValued: boolean;
	description?: string;
}

export interface AccountsPanelConfig {
	sourceName: string;
	attributes: AccountsSchemaAttribute[];
	identityAttribute: string;
	displayAttribute: string;
	/** source supports the ENABLE feature: enable/disable actions */
	canEnable: boolean;
	/** source supports the UNLOCK feature */
	canUnlock: boolean;
	/** accounts can be created/edited (Delimited File only) */
	editable: boolean;
	pageSize: number;
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
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let text = "";
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

const css = `
	:root { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
	body { margin: 0; padding: 16px 20px 24px; }
	h1 { margin: 0 0 4px; font-size: 1.25rem; font-weight: 600; }
	.summary { color: var(--vscode-descriptionForeground); margin-bottom: 12px; }
	.bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-bottom: 12px; }
	.field { display: flex; flex-direction: column; gap: 4px; }
	.field > label { font-size: 0.82rem; color: var(--vscode-descriptionForeground); }
	input[type=text], select, textarea { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, var(--vscode-panel-border)); border-radius: 4px; padding: 4px 8px; font: inherit; box-sizing: border-box; }
	input:focus, select:focus, textarea:focus, button:focus-visible { outline: 1px solid var(--vscode-focusBorder); }
	textarea { width: 100%; min-height: 60px; resize: vertical; }
	button.btn { display: inline-flex; align-items: center; gap: 6px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; font: inherit; }
	button.btn:hover { background: var(--vscode-button-hoverBackground); }
	button.btn.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
	button.btn.secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
	button.btn:disabled { opacity: .6; cursor: default; }
	button.icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; padding: 0; border: none; border-radius: 4px; background: transparent; color: var(--vscode-foreground); cursor: pointer; }
	button.icon:hover { background: var(--vscode-toolbar-hoverBackground, var(--vscode-list-hoverBackground)); }
	button.icon:disabled { opacity: .4; cursor: default; }
	[hidden] { display: none !important; }
	svg { width: 16px; height: 16px; fill: currentColor; flex: none; }
	.spacer { flex: 1; }
	.chip { display: inline-flex; align-items: center; gap: 4px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: 10px; padding: 2px 4px 2px 10px; }
	.chip button { background: none; border: none; color: inherit; cursor: pointer; padding: 0 4px; font: inherit; }
	.dropdown { position: relative; }
	.dropdown-panel { position: absolute; right: 0; top: calc(100% + 4px); z-index: 10; min-width: 220px; max-height: 320px; overflow: auto; background: var(--vscode-editorWidget-background, var(--vscode-editor-background)); border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border)); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,.25); padding: 4px 0; }
	.dropdown-panel[hidden] { display: none; }
	.dropdown-panel label { display: flex; gap: 8px; align-items: center; padding: 3px 10px; cursor: pointer; }
	.dropdown-panel label:hover { background: var(--vscode-list-hoverBackground); }
	.dropdown-panel .sep { border-top: 1px solid var(--vscode-panel-border); margin: 4px 0; }
	.table-wrap { overflow: auto; border: 1px solid var(--vscode-panel-border); border-radius: 6px; }
	.table-wrap.loading { opacity: .5; pointer-events: none; }
	table { border-collapse: collapse; table-layout: fixed; }
	thead th { position: sticky; top: 0; z-index: 1; text-align: left; padding: 8px 12px; background: var(--vscode-editor-inactiveSelectionBackground); border-bottom: 1px solid var(--vscode-panel-border); font-weight: 600; white-space: nowrap; }
	tbody td { padding: 6px 12px; border-bottom: 1px solid var(--vscode-panel-border); vertical-align: top; word-break: break-word; overflow: hidden; box-sizing: border-box; }
	thead th { overflow: hidden; text-overflow: ellipsis; box-sizing: border-box; }
	.col-resizer { position: absolute; top: 0; right: 0; width: 6px; height: 100%; cursor: col-resize; user-select: none; touch-action: none; }
	.col-resizer:hover, .col-resizer.active { background: var(--vscode-focusBorder); }
	body.col-resizing { cursor: col-resize; user-select: none; }
	tbody tr:nth-child(even) { background: color-mix(in srgb, var(--vscode-editor-background) 92%, var(--vscode-foreground) 8%); }
	tbody tr.pending { opacity: .5; }
	tbody tr:hover { background: var(--vscode-list-hoverBackground); }
	td.actions { white-space: nowrap; }
	td .line { white-space: pre-wrap; }
	td .line + .line { border-top: 1px dotted var(--vscode-panel-border); margin-top: 2px; padding-top: 2px; }
	.empty td { text-align: center; padding: 24px; color: var(--vscode-descriptionForeground); }
	.badge { display: inline-block; border-radius: 10px; padding: 1px 8px; font-size: .82rem; font-weight: 600; margin-right: 4px; white-space: nowrap; }
	.badge.ok { background: color-mix(in srgb, var(--vscode-testing-iconPassed, #388a34) 25%, transparent); color: var(--vscode-testing-iconPassed, #388a34); }
	.badge.ko { background: color-mix(in srgb, var(--vscode-testing-iconFailed, #f14c4c) 25%, transparent); color: var(--vscode-testing-iconFailed, #f14c4c); }
	.badge.warn { background: color-mix(in srgb, var(--vscode-editorWarning-foreground, #cca700) 25%, transparent); color: var(--vscode-editorWarning-foreground, #cca700); }
	.badge.info { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
	.muted { color: var(--vscode-descriptionForeground); }
	.pager { display: flex; align-items: center; gap: 12px; margin-top: 12px; color: var(--vscode-descriptionForeground); }
	.backdrop { position: fixed; inset: 0; z-index: 30; background: rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center; }
	.backdrop[hidden] { display: none; }
	.modal { background: var(--vscode-editorWidget-background, var(--vscode-editor-background)); border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border)); border-radius: 6px; width: min(640px, 92vw); max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
	.modal h2 { margin: 0; padding: 12px 16px; font-size: 1.05rem; border-bottom: 1px solid var(--vscode-panel-border); }
	.modal .body { padding: 12px 16px; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
	.modal .footer { padding: 10px 16px; border-top: 1px solid var(--vscode-panel-border); display: flex; justify-content: flex-end; gap: 8px; }
	.modal .field input[type=text] { width: 100%; }
	.hint { font-size: .8rem; color: var(--vscode-descriptionForeground); }
	.results { max-height: 280px; overflow: auto; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
	.result { padding: 6px 10px; cursor: pointer; border-bottom: 1px solid var(--vscode-panel-border); }
	.result:last-child { border-bottom: none; }
	.result:hover { background: var(--vscode-list-hoverBackground); }
`;

const icons = {
	refresh: '<svg viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M13 8a5 5 0 1 1-1.5-3.6"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M13 2.5v3h-3"/></svg>',
	plus: '<svg viewBox="0 0 16 16"><path d="M7 2h2v5h5v2H9v5H7V9H2V7h5z"/></svg>',
	columns: '<svg viewBox="0 0 16 16"><path d="M2 2h12v12H2zm1.5 1.5v9H7V3.5zm5 0v9h4v-9z"/></svg>',
	edit: '<svg viewBox="0 0 16 16"><path d="M11.4 1.6l3 3L5 14H2v-3zm-8 10.2V13h1.2l7.2-7.2-1.2-1.2z"/></svg>',
	enable: '<svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM6.5 5v6l5-3z"/></svg>',
	disable: '<svg viewBox="0 0 16 16"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 1.5a5.5 5.5 0 0 1 4.2 9L4.5 3.8A5.5 5.5 0 0 1 8 2.5zM3.8 4.5l7.7 7.7A5.5 5.5 0 0 1 3.8 4.5z"/></svg>',
	unlock: '<svg viewBox="0 0 16 16"><path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H3v8h10V6H6V4.5a2 2 0 0 1 3.9-.6l1.5-.4A3.5 3.5 0 0 0 8 1zM4.5 7.5h7v5.5h-7z"/></svg>',
	reload: '<svg viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M13 8a5 5 0 1 1-1.5-3.6"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M13 2.5v3h-3"/></svg>',
	trash: '<svg viewBox="0 0 16 16"><path d="M6 1h4v1.5h4V4H2V2.5h4zM3 5h10l-.8 9.5H3.8zm2 1.5l.4 6h1.1l-.4-6zm3.5 0v6h1.1v-6z"/></svg>',
	identity: '<svg viewBox="0 0 16 16"><path d="M8 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM2 14c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5v.5H2zm1.6-.5h8.8c-.4-1.4-2.2-2.5-4.4-2.5s-4 1.1-4.4 2.5z"/></svg>',
};

export function buildAccountsHtml(config: AccountsPanelConfig): string {
	const nonce = getNonce();
	const configJson = JSON.stringify({ ...config, icons }).replace(/</g, "\\u003c");

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Accounts: ${escapeHtml(config.sourceName)}</title>
	<style>${css}</style>
</head>
<body>
	<h1>${escapeHtml(config.sourceName)}</h1>
	<div class="summary" id="summary">Loading...</div>

	<div class="bar">
		<div class="field">
			<label for="f-corr">Correlation</label>
			<select id="f-corr">
				<option value="all">All</option>
				<option value="correlated">Correlated</option>
				<option value="uncorrelated">Not correlated</option>
			</select>
		</div>
		<div class="field">
			<label>Identity</label>
			<div id="f-identity"></div>
		</div>
		<div class="field">
			<label for="f-search">Name or native identity starts with</label>
			<input type="text" id="f-search" placeholder="Search...">
		</div>
		<div class="spacer"></div>
		<button type="button" class="btn" id="btn-create" title="Create account" hidden></button>
		<button type="button" class="btn secondary" id="btn-refresh" title="Refresh"></button>
		<div class="dropdown">
			<button type="button" class="btn secondary" id="btn-columns" title="Select columns"></button>
			<div class="dropdown-panel" id="columns-panel" hidden></div>
		</div>
	</div>

	<div class="table-wrap" id="table-wrap">
		<table id="table">
			<thead><tr id="head-row"></tr></thead>
			<tbody id="body"></tbody>
		</table>
	</div>
	<div class="pager">
		<button type="button" class="btn secondary" id="prev">Previous</button>
		<span id="page-info"></span>
		<button type="button" class="btn secondary" id="next">Next</button>
	</div>

	<div class="backdrop" id="identity-modal" hidden>
		<div class="modal" role="dialog" aria-modal="true">
			<h2 id="identity-title">Select an identity</h2>
			<div class="body">
				<div class="field">
					<label for="identity-term">Alias, email, first name or last name starts with</label>
					<input type="text" id="identity-term" placeholder="Type to search...">
				</div>
				<div class="results" id="identity-results"></div>
			</div>
			<div class="footer"><button type="button" class="btn secondary" id="identity-cancel">Cancel</button></div>
		</div>
	</div>

	<div class="backdrop" id="form-modal" hidden>
		<div class="modal" role="dialog" aria-modal="true">
			<h2 id="form-title"></h2>
			<div class="body" id="form-body"></div>
			<div class="footer">
				<button type="button" class="btn secondary" id="form-cancel">Cancel</button>
				<button type="button" class="btn" id="form-save">Save</button>
			</div>
		</div>
	</div>

	<script nonce="${nonce}">
	(function () {
		const vscode = acquireVsCodeApi();
		const config = ${configJson};
		const icons = config.icons;
		const FIXED = [
			{ key: "@id", label: "ID" },
			{ key: "@identity", label: "Identity" },
			{ key: "@status", label: "Status" },
		];
		const allColumns = FIXED.concat(config.attributes.map(function (a) { return { key: a.name, label: a.name }; }));
		const saved = vscode.getState() || {};
		let visible = saved.visible || allColumns.map(function (c) { return c.key; });
		const widths = saved.widths || {};
		const DEFAULT_WIDTHS = { "@actions": 190, "@id": 280, "@identity": 180, "@status": 140 };
		const MIN_WIDTH = 50;
		function widthOf(key) { return widths[key] || DEFAULT_WIDTHS[key] || 200; }
		const state = { rows: [], total: 0, page: 0, filter: { correlation: "all", identityId: "", identityName: "", search: "" }, pickerMode: "filter", pickerAccount: null, pending: {}, formMode: null, formAccount: null, requestId: 0 };

		const $ = function (id) { return document.getElementById(id); };
		function el(tag, cls, text) {
			const e = document.createElement(tag);
			if (cls) { e.className = cls; }
			if (text !== undefined) { e.textContent = text; }
			return e;
		}
		function iconButton(icon, title, onClick) {
			const b = el("button", "icon");
			b.type = "button";
			b.title = title;
			b.setAttribute("aria-label", title);
			b.innerHTML = icon;
			b.addEventListener("click", onClick);
			return b;
		}
		function badge(text, kind) { return el("span", "badge " + kind, text); }

		$("btn-refresh").innerHTML = icons.refresh + "Refresh";
		$("btn-columns").innerHTML = icons.columns + "Columns";
		if (config.editable) {
			$("btn-create").hidden = false;
			$("btn-create").innerHTML = icons.plus + "Create";
		}

		function save() { vscode.setState({ visible: visible, widths: widths }); }
		function setLoading(on) { $("table-wrap").classList.toggle("loading", on); }

		function load() {
			setLoading(true);
			vscode.postMessage({ command: "load", page: state.page, filter: state.filter });
		}
		function reloadFromStart() { state.page = 0; load(); }

		// ---------- table ----------
		function visibleColumns() { return allColumns.filter(function (c) { return visible.indexOf(c.key) >= 0; }); }

		function addTh(row, key, label, title) {
			const th = el("th", "", label);
			if (title) { th.title = title; }
			th.style.width = widthOf(key) + "px";
			const handle = el("div", "col-resizer");
			handle.addEventListener("mousedown", function (e) { startResize(e, key, th, handle); });
			th.appendChild(handle);
			row.appendChild(th);
		}

		function updateTableWidth() {
			const keys = ["@actions"].concat(visibleColumns().map(function (c) { return c.key; }));
			$("table").style.width = keys.reduce(function (sum, k) { return sum + widthOf(k); }, 0) + "px";
		}

		function startResize(e, key, th, handle) {
			e.preventDefault();
			e.stopPropagation();
			const startX = e.clientX;
			const startWidth = th.getBoundingClientRect().width;
			handle.classList.add("active");
			document.body.classList.add("col-resizing");
			function onMove(ev) {
				widths[key] = Math.max(MIN_WIDTH, Math.round(startWidth + ev.clientX - startX));
				th.style.width = widths[key] + "px";
				updateTableWidth();
			}
			function onUp() {
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
				handle.classList.remove("active");
				document.body.classList.remove("col-resizing");
				save();
			}
			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		}

		function renderHead() {
			const row = $("head-row");
			row.textContent = "";
			addTh(row, "@actions", "Actions");
			visibleColumns().forEach(function (c) {
				if (c.key === config.identityAttribute) { addTh(row, c.key, c.label + " (native identity)", "Native identity"); }
				else if (c.key === config.displayAttribute) { addTh(row, c.key, c.label + " (display name)", "Display name"); }
				else { addTh(row, c.key, c.label); }
			});
			updateTableWidth();
		}

		function renderValue(td, value) {
			if (value === undefined || value === null || value === "") { return; }
			const list = Array.isArray(value) ? value : [value];
			list.forEach(function (v) {
				const text = typeof v === "object" ? JSON.stringify(v) : String(v);
				td.appendChild(el("div", "line", text));
			});
		}

		function renderStatus(td, r) {
			if (config.canEnable) {
				td.appendChild(r.disabled ? badge("Disabled", "ko") : badge("Enabled", "ok"));
			}
			if (r.locked) { td.appendChild(badge("Locked", "warn")); }
			if (!config.canEnable && !r.locked) { td.appendChild(badge("Active", "ok")); }
		}

		function renderActions(td, r) {
			if (config.editable) {
				td.appendChild(iconButton(icons.edit, "Edit account", function () { openForm("edit", r); }));
			}
			if (config.canEnable) {
				if (r.disabled) {
					td.appendChild(iconButton(icons.enable, "Enable account", function () { act("enable", r.id); }));
				} else {
					td.appendChild(iconButton(icons.disable, "Disable account", function () { act("disable", r.id); }));
				}
			}
			if (config.canUnlock) {
				const b = iconButton(icons.unlock, r.locked ? "Unlock account" : "Account is not locked", function () { act("unlock", r.id); });
				b.disabled = !r.locked;
				td.appendChild(b);
			}
			td.appendChild(iconButton(icons.reload, "Reload account from the source", function () { act("reload", r.id); }));
			td.appendChild(iconButton(icons.trash, "Delete account", function () { act("delete", r.id); }));
			td.appendChild(iconButton(icons.identity, r.uncorrelated ? "Correlate to an identity" : "Change correlated identity", function () { openPicker("correlate", r); }));
		}

		function setPending(id, on) { if (on) { state.pending[id] = true; } else { delete state.pending[id]; } renderBody(); }
		function act(command, id) { setPending(id, true); vscode.postMessage({ command: command, id: id }); }

		function renderBody() {
			const body = $("body");
			body.textContent = "";
			const cols = visibleColumns();
			if (state.rows.length === 0) {
				const tr = el("tr", "empty");
				const td = el("td", "", "No account found");
				td.colSpan = cols.length + 1;
				tr.appendChild(td);
				body.appendChild(tr);
				return;
			}
			state.rows.forEach(function (r) {
				const tr = document.createElement("tr");
				const isPending = !!state.pending[r.id];
				if (isPending) { tr.className = "pending"; }
				const actions = el("td", "actions");
				renderActions(actions, r);
				if (isPending) { actions.querySelectorAll("button").forEach(function (b) { b.disabled = true; }); }
				tr.appendChild(actions);
				cols.forEach(function (c) {
					const td = document.createElement("td");
					if (c.key === "@id") { td.appendChild(el("span", "muted", r.id)); }
					else if (c.key === "@identity") {
						if (r.uncorrelated) { td.appendChild(badge("Not correlated", "info")); }
						else { td.appendChild(el("span", "", r.identityName || r.identityId || "")); }
					}
					else if (c.key === "@status") { renderStatus(td, r); }
					else { renderValue(td, r.attributes[c.key]); }
					tr.appendChild(td);
				});
				body.appendChild(tr);
			});
		}

		function renderPager() {
			const pages = Math.max(1, Math.ceil(state.total / config.pageSize));
			$("page-info").textContent = "Page " + (state.page + 1) + " / " + pages;
			$("prev").disabled = state.page <= 0;
			$("next").disabled = state.page + 1 >= pages;
			$("summary").textContent = state.total + " account" + (state.total === 1 ? "" : "s");
		}

		function render() { renderHead(); renderBody(); renderPager(); }

		// ---------- columns ----------
		function renderColumnsPanel() {
			const panel = $("columns-panel");
			panel.textContent = "";
			const all = el("label");
			const allCb = document.createElement("input");
			allCb.type = "checkbox";
			allCb.checked = visible.length === allColumns.length;
			allCb.addEventListener("change", function () {
				visible = allCb.checked ? allColumns.map(function (c) { return c.key; }) : [];
				save(); renderColumnsPanel(); render();
			});
			all.appendChild(allCb);
			all.appendChild(el("span", "", "All columns"));
			panel.appendChild(all);
			panel.appendChild(el("div", "sep"));
			allColumns.forEach(function (c) {
				const l = el("label");
				const cb = document.createElement("input");
				cb.type = "checkbox";
				cb.checked = visible.indexOf(c.key) >= 0;
				cb.addEventListener("change", function () {
					visible = allColumns.map(function (x) { return x.key; }).filter(function (k) {
						return k === c.key ? cb.checked : visible.indexOf(k) >= 0;
					});
					save(); allCb.checked = visible.length === allColumns.length; render();
				});
				l.appendChild(cb);
				l.appendChild(el("span", "", c.label));
				panel.appendChild(l);
			});
		}
		$("btn-columns").addEventListener("click", function (e) {
			e.stopPropagation();
			$("columns-panel").hidden = !$("columns-panel").hidden;
		});
		document.addEventListener("click", function (e) {
			if (!e.target.closest(".dropdown")) { $("columns-panel").hidden = true; }
		});

		// ---------- filters ----------
		function renderIdentityFilter() {
			const host = $("f-identity");
			host.textContent = "";
			if (state.filter.identityId) {
				const chip = el("span", "chip", state.filter.identityName || state.filter.identityId);
				const x = el("button", "", "\\u00d7");
				x.type = "button";
				x.title = "Clear identity filter";
				x.addEventListener("click", function () {
					state.filter.identityId = ""; state.filter.identityName = "";
					renderIdentityFilter(); reloadFromStart();
				});
				chip.appendChild(x);
				host.appendChild(chip);
			} else {
				const b = el("button", "btn secondary");
				b.type = "button";
				b.innerHTML = icons.identity + "Select...";
				b.addEventListener("click", function () { openPicker("filter", null); });
				host.appendChild(b);
			}
		}
		$("f-corr").addEventListener("change", function () { state.filter.correlation = $("f-corr").value; reloadFromStart(); });
		let searchTimer;
		$("f-search").addEventListener("input", function () {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(function () { state.filter.search = $("f-search").value; reloadFromStart(); }, 400);
		});
		$("f-search").addEventListener("keydown", function (e) {
			if (e.key === "Enter") { clearTimeout(searchTimer); state.filter.search = $("f-search").value; reloadFromStart(); }
		});
		$("btn-refresh").addEventListener("click", load);
		$("prev").addEventListener("click", function () { if (state.page > 0) { state.page--; load(); } });
		$("next").addEventListener("click", function () { state.page++; load(); });

		// ---------- identity picker ----------
		let identityTimer;
		function openPicker(mode, account) {
			state.pickerMode = mode;
			state.pickerAccount = account;
			$("identity-title").textContent = mode === "filter" ? "Filter by identity" : "Correlate " + (account.name || account.id) + " to...";
			$("identity-term").value = "";
			$("identity-results").textContent = "";
			$("identity-modal").hidden = false;
			$("identity-term").focus();
		}
		function closePicker() { $("identity-modal").hidden = true; }
		$("identity-cancel").addEventListener("click", closePicker);
		$("identity-term").addEventListener("input", function () {
			clearTimeout(identityTimer);
			identityTimer = setTimeout(function () {
				state.requestId++;
				vscode.postMessage({ command: "searchIdentities", term: $("identity-term").value, requestId: state.requestId });
			}, 300);
		});
		function renderIdentities(items, error) {
			const host = $("identity-results");
			host.textContent = "";
			if (error) { host.appendChild(el("div", "result muted", error)); return; }
			if (items.length === 0) { host.appendChild(el("div", "result muted", "No identity found")); return; }
			items.forEach(function (i) {
				const row = el("div", "result");
				row.appendChild(el("div", "", i.name || i.alias));
				row.appendChild(el("div", "hint", [i.alias, i.email].filter(Boolean).join(" - ")));
				row.addEventListener("click", function () {
					if (state.pickerMode === "filter") {
						state.filter.identityId = i.id; state.filter.identityName = i.name || i.alias;
						closePicker(); renderIdentityFilter(); reloadFromStart();
					} else {
						setPending(state.pickerAccount.id, true);
						vscode.postMessage({ command: "updateIdentity", id: state.pickerAccount.id, identityId: i.id, identityName: i.name || i.alias });
						closePicker();
					}
				});
				host.appendChild(row);
			});
		}

		// ---------- create / edit form ----------
		const inputs = {};
		function openForm(mode, account) {
			state.formMode = mode;
			state.formAccount = account;
			$("form-title").textContent = mode === "create" ? "Create account" : "Edit account " + (account.name || account.id);
			const body = $("form-body");
			body.textContent = "";
			config.attributes.forEach(function (a) {
				const f = el("div", "field");
				const label = el("label", "", a.name + (a.name === config.identityAttribute ? " (native identity)" : "") + (a.multiValued ? " - one value per line" : ""));
				f.appendChild(label);
				let input;
				if (a.multiValued) {
					input = document.createElement("textarea");
				} else {
					input = document.createElement("input");
					input.type = "text";
				}
				const current = mode === "edit" ? account.attributes[a.name] : undefined;
				if (current !== undefined && current !== null) {
					input.value = Array.isArray(current) ? current.join("\\n") : String(current);
				}
				if (mode === "edit" && a.name === config.identityAttribute) { input.disabled = true; }
				if (a.description) { input.title = a.description; }
				inputs[a.name] = input;
				f.appendChild(input);
				if (a.type && a.type !== "STRING") { f.appendChild(el("div", "hint", a.type)); }
				body.appendChild(f);
			});
			$("form-modal").hidden = false;
		}
		function closeForm() { $("form-modal").hidden = true; }
		$("btn-create").addEventListener("click", function () { openForm("create", null); });
		$("form-cancel").addEventListener("click", closeForm);
		$("form-save").addEventListener("click", function () {
			const values = {};
			config.attributes.forEach(function (a) {
				if (inputs[a.name] && !inputs[a.name].disabled) { values[a.name] = inputs[a.name].value; }
			});
			$("form-save").disabled = true;
			if (state.formAccount) { setPending(state.formAccount.id, true); }
			vscode.postMessage({ command: "save", mode: state.formMode, id: state.formAccount ? state.formAccount.id : undefined, values: values });
		});
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") { closeForm(); closePicker(); $("columns-panel").hidden = true; }
		});

		// ---------- host messages ----------
		window.addEventListener("message", function (event) {
			const m = event.data;
			if (!m || typeof m !== "object") { return; }
			switch (m.command) {
				case "accounts":
					state.rows = m.rows; state.total = m.total; state.page = m.page;
					setLoading(false); render();
					break;
				case "accountUpdated":
					state.rows = state.rows.map(function (r) { return r.id === m.row.id ? m.row : r; });
					delete state.pending[m.row.id];
					renderBody();
					break;
				case "loadFailed":
				case "idle":
					if (m.id) { delete state.pending[m.id]; } else { state.pending = {}; }
					setLoading(false); $("form-save").disabled = false; renderBody();
					break;
				case "identities":
					if (m.requestId === state.requestId) { renderIdentities(m.items || [], m.error); }
					break;
				case "closeModal":
					closeForm(); closePicker(); $("form-save").disabled = false;
					break;
			}
		});

		renderColumnsPanel();
		renderIdentityFilter();
		render();
		load();
	})();
	</script>
</body>
</html>`;
}
