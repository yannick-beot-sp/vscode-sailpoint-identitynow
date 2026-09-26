export function highlightJson(json: string): string {
	const escaped = json
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	return escaped.replace(
		/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
		(_match, str: string | undefined, colon: string | undefined, literal: string | undefined, number: string | undefined) => {
			if (str) {
				const cls = colon ? "json-key" : "json-string";
				return '<span class="' + cls + '">' + str + "</span>" + (colon || "");
			}
			if (literal) {
				const cls = literal === "null" ? "json-null" : "json-boolean";
				return '<span class="' + cls + '">' + literal + "</span>";
			}
			return '<span class="json-number">' + number + "</span>";
		}
	);
}

export const jsonDrawerCss = `
		.json-drawer-backdrop {
			position: fixed;
			inset: 0;
			z-index: 30;
			background: rgba(0, 0, 0, 0.35);
		}

		.json-drawer {
			position: fixed;
			top: 0;
			right: 0;
			z-index: 31;
			display: flex;
			flex-direction: column;
			width: min(720px, 100%);
			height: 100%;
			background: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			border-left: 1px solid var(--vscode-panel-border);
			box-shadow: -8px 0 24px rgba(0, 0, 0, 0.28);
		}

		.json-drawer[hidden],
		.json-drawer-backdrop[hidden] {
			display: none !important;
		}

		.json-drawer-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--vscode-panel-border);
		}

		.json-drawer-header h2 {
			margin: 0;
			min-width: 0;
			font-size: 1rem;
			font-weight: 600;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.json-drawer-actions {
			display: flex;
			flex: none;
			gap: 8px;
		}

		.json-drawer-body {
			margin: 0;
			padding: 12px 16px 24px;
			overflow: auto;
			flex: 1;
			background: var(--vscode-editor-background);
			font-family: var(--vscode-editor-font-family, monospace);
			font-size: var(--vscode-editor-font-size, 13px);
			line-height: 1.45;
			tab-size: 2;
			white-space: pre;
			user-select: text;
		}

		.json-key { color: var(--vscode-debugTokenExpression-name, var(--vscode-symbolIcon-propertyForeground, #9cdcfe)); }
		.json-string { color: var(--vscode-debugTokenExpression-string, #ce9178); }
		.json-number { color: var(--vscode-debugTokenExpression-number, #b5cea8); }
		.json-boolean,
		.json-null { color: var(--vscode-debugTokenExpression-boolean, #569cd6); }
`;

export const jsonDrawerMarkup = `
	<div id="json-drawer-backdrop" class="json-drawer-backdrop" hidden></div>
	<aside id="json-drawer" class="json-drawer" role="dialog" aria-modal="true" aria-labelledby="json-drawer-title" aria-hidden="true" hidden>
		<div class="json-drawer-header">
			<h2 id="json-drawer-title">JSON</h2>
			<div class="json-drawer-actions">
				<button type="button" class="action-button secondary" id="json-drawer-copy">Copy</button>
				<button type="button" class="action-button secondary" id="json-drawer-close">Close</button>
			</div>
		</div>
		<pre id="json-drawer-body" class="json-drawer-body" spellcheck="false"></pre>
	</aside>
`;

export function jsonDrawerScript(): string {
	const highlightSource = highlightJson
		.toString()
		.replace(/^function\s*[^(]*/, "function highlightJson");

	return `
		${highlightSource}

		let jsonDrawerText = "";
		let jsonDrawerReturnFocus = null;

		function openJsonDrawer(title, json) {
			const backdrop = document.getElementById("json-drawer-backdrop");
			const drawer = document.getElementById("json-drawer");
			const titleNode = document.getElementById("json-drawer-title");
			const body = document.getElementById("json-drawer-body");
			if (!backdrop || !drawer || !titleNode || !body) {
				return;
			}

			jsonDrawerText = String(json ?? "");
			titleNode.textContent = title || "JSON";
			body.innerHTML = highlightJson(jsonDrawerText);
			backdrop.hidden = false;
			drawer.hidden = false;
			drawer.setAttribute("aria-hidden", "false");
			jsonDrawerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			document.getElementById("json-drawer-close")?.focus();
		}

		function closeJsonDrawer() {
			const backdrop = document.getElementById("json-drawer-backdrop");
			const drawer = document.getElementById("json-drawer");
			if (backdrop) {
				backdrop.hidden = true;
			}
			if (drawer) {
				drawer.hidden = true;
				drawer.setAttribute("aria-hidden", "true");
			}
			if (jsonDrawerReturnFocus) {
				jsonDrawerReturnFocus.focus();
			}
			jsonDrawerReturnFocus = null;
		}

		function initJsonDrawer() {
			document.getElementById("json-drawer-close")?.addEventListener("click", closeJsonDrawer);
			document.getElementById("json-drawer-backdrop")?.addEventListener("click", closeJsonDrawer);
			document.getElementById("json-drawer-copy")?.addEventListener("click", () => {
				const button = document.getElementById("json-drawer-copy");
				if (!button) {
					return;
				}
				const original = button.textContent;
				const markCopied = () => {
					button.textContent = "Copied";
					setTimeout(() => {
						button.textContent = original;
					}, 1200);
				};
				const fallbackCopy = () => {
					const body = document.getElementById("json-drawer-body");
					if (!body) {
						return;
					}
					const selection = window.getSelection();
					if (!selection) {
						return;
					}
					const range = document.createRange();
					range.selectNodeContents(body);
					selection.removeAllRanges();
					selection.addRange(range);
					document.execCommand("copy");
					selection.removeAllRanges();
					markCopied();
				};
				if (!navigator.clipboard?.writeText) {
					fallbackCopy();
					return;
				}
				navigator.clipboard.writeText(jsonDrawerText).then(markCopied).catch(fallbackCopy);
			});
			document.addEventListener("keydown", (event) => {
				const drawer = document.getElementById("json-drawer");
				if (event.key === "Escape" && drawer && !drawer.hidden) {
					event.preventDefault();
					event.stopPropagation();
					closeJsonDrawer();
				}
			}, true);
		}
	`;
}
