import { highlightJson } from "../identity/jsonDrawerSnippet";

const PARENT_CSP = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    // srcdoc is an about: URL. frame-src must allow it; the parent policy still
    // applies inside the frame, so the fragment cannot loosen it.
    "frame-src about:",
].join("; ");

const FRAME_CSP = [
    "default-src 'none'",
    "img-src data:",
    "style-src 'unsafe-inline'",
    "font-src data:",
].join("; ");

/**
 * Render a notification template body for the preview webview.
 *
 * The fragment is a separate sandboxed document (no scripts, no top navigation,
 * no remote images, stylesheets, or fonts). It cannot close the parent document
 * or replace its content-security policy.
 */
export function buildNotificationTemplatePreviewHtml(bodyFragment: string): string {
    const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">
</head>
<body>
${bodyFragment}
</body>
</html>`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${PARENT_CSP}">
<style>
  html, body, iframe { margin: 0; width: 100%; height: 100%; border: 0; background: #ffffff; }
</style>
</head>
<body>
<iframe sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" srcdoc="${escapeAttribute(srcdoc)}"></iframe>
</body>
</html>`;
}

const EMAIL_FRAME_CSP = [
    "default-src 'none'",
    "img-src https: data:",
    "style-src 'unsafe-inline' https:",
    "font-src https: data:",
    "media-src https:",
].join("; ");

export const SET_EXAMPLE_VALUES_MESSAGE = "setExampleValues";
export const UPDATE_EXAMPLE_VALUES_MESSAGE = "updateExampleValues";
export const PREVIEW_READY_MESSAGE = "previewReady";
export const PREVIEW_STATE_MESSAGE = "previewState";

export interface NotificationTemplatePreviewState {
    command: typeof PREVIEW_STATE_MESSAGE;
    srcdoc: string;
    showExamples: boolean;
    error: string;
    jsonError: string;
    examplesJson: string;
    replaceExamples: boolean;
}

export function createPreviewNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function buildPreviewFrameSrcdoc(bodyFragment: string): string {
    return emailDocument(bodyFragment, EMAIL_FRAME_CSP);
}

/**
 * Source of the JSON tokenizer injected into the preview page.
 *
 * The page cannot load a script file, so the same function used by the identity
 * JSON drawer is copied into the nonce script.
 */
function exampleJsonHighlighterSource(): string {
    return highlightJson
        .toString()
        .replace(/^function\s*[^(]*/, "function highlightJson");
}

/**
 * Preview shell: a header checkbox above a sandboxed copy of the e-mail.
 *
 * When example values are on, a JSON editor lists each data variable and its
 * example. A highlight layer colors keys, strings, numbers, and literals behind
 * the textarea. The checkbox script is the only script allowed to run. The
 * template body is an escaped srcdoc, so it cannot close this document or
 * inherit the nonce.
 */
export function buildNotificationTemplatePreviewPage(options: {
    body: string;
    showExamples: boolean;
    nonce: string;
    error?: string;
    jsonError?: string;
    examplesJson?: string;
}): string {
    const { body, showExamples, nonce, error, jsonError, examplesJson } = options;
    const parentCsp = [
        "default-src 'none'",
        "img-src https: data:",
        "style-src 'unsafe-inline' https:",
        "font-src https: data:",
        "media-src https:",
        `script-src 'nonce-${nonce}'`,
        "frame-src about:",
    ].join("; ");
    const srcdoc = buildPreviewFrameSrcdoc(body);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${parentCsp}">
<style>
  html, body { margin: 0; height: 100%; background: var(--vscode-editor-background); color: var(--vscode-foreground); }
  body { display: flex; flex-direction: column; }
  header {
    flex: none;
    display: flex;
    align-items: center;
    padding: 4px 12px;
    border-bottom: 1px solid var(--vscode-widget-border, transparent);
    font-family: var(--vscode-font-family, sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }
  header label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .error { color: var(--vscode-errorForeground); }
  header .error { margin-left: 12px; }
  #workspace { flex: 1; display: flex; min-height: 0; min-width: 0; }
  #examples {
    flex: none;
    width: 420px;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--vscode-editor-background);
  }
  #examples[hidden], #splitter[hidden] { display: none; }
  .examples-toolbar {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--vscode-widget-border, transparent);
    font-family: var(--vscode-font-family, sans-serif);
    font-size: var(--vscode-font-size, 13px);
  }
  #json-error { flex: none; margin: 0; padding: 4px 12px; }
  #json-error:empty { display: none; }
  #example-editor {
    flex: 1;
    min-height: 0;
    display: grid;
    overflow: hidden;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    font-weight: normal;
    line-height: var(--vscode-editor-line-height, 18px);
    tab-size: 2;
  }
  #example-highlight,
  #example-json {
    grid-area: 1 / 1;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    margin: 0;
    border: 0;
    padding: 8px 12px;
    scrollbar-gutter: stable;
    overflow: auto;
    white-space: pre;
    overflow-wrap: normal;
    word-break: normal;
    font: inherit;
    line-height: inherit;
    tab-size: inherit;
    letter-spacing: normal;
    font-variant-ligatures: none;
  }
  #example-highlight {
    overflow: hidden;
    pointer-events: none;
    user-select: none;
  }
  #example-json {
    z-index: 1;
    resize: none;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    caret-color: var(--vscode-editor-foreground);
  }
  #example-json:focus { outline: none; }
  #example-editor.ready #example-json {
    color: transparent;
    background: transparent;
    -webkit-text-fill-color: transparent;
  }
  #example-editor.ready #example-json::selection {
    background: var(--vscode-editor-selectionBackground, rgba(38, 79, 120, 0.8));
    color: var(--vscode-editor-selectionForeground, var(--vscode-editor-foreground));
    -webkit-text-fill-color: var(--vscode-editor-selectionForeground, var(--vscode-editor-foreground));
  }
  .json-key { color: var(--vscode-debugTokenExpression-name, var(--vscode-symbolIcon-propertyForeground, #9cdcfe)); }
  .json-string { color: var(--vscode-debugTokenExpression-string, #ce9178); }
  .json-number { color: var(--vscode-debugTokenExpression-number, #b5cea8); }
  .json-boolean,
  .json-null { color: var(--vscode-debugTokenExpression-boolean, #569cd6); }
  button.update {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 2px;
    padding: 3px 10px;
    cursor: pointer;
    font: inherit;
  }
  button.update:hover { background: var(--vscode-button-hoverBackground); }
  #splitter {
    flex: none;
    width: 4px;
    cursor: col-resize;
    background: var(--vscode-widget-border, transparent);
  }
  #splitter:hover { background: var(--vscode-focusBorder); }
  iframe { flex: 1; min-width: 0; width: 100%; border: 0; background: #ffffff; }
</style>
</head>
<body>
<header>
<label><input id="example-values" type="checkbox"${showExamples ? " checked" : ""}> Example values</label>
<span id="velocity-error" class="error">${error ? `Velocity error: ${escapeHtml(error)}` : ""}</span>
</header>
<div id="workspace">
<section id="examples"${showExamples ? "" : " hidden"}>
<div class="examples-toolbar">
<span>Variables</span>
<button id="update-examples" class="update" type="button" title="Apply these values to the preview (Ctrl+Enter)">Update preview</button>
</div>
<p id="json-error" class="error">${jsonError ? escapeHtml(jsonError) : ""}</p>
<div id="example-editor">
<pre id="example-highlight" aria-hidden="true"></pre>
<textarea id="example-json" spellcheck="false" wrap="off" aria-label="Example values">${escapeHtml(examplesJson ?? "")}</textarea>
</div>
</section>
<div id="splitter"${showExamples ? "" : " hidden"}></div>
<iframe id="preview-frame" title="${showExamples ? "Example values" : "Template"}" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" srcdoc="${escapeAttribute(srcdoc)}"></iframe>
</div>
<script nonce="${nonce}">
${exampleJsonHighlighterSource()}
const vscode = acquireVsCodeApi();
const examples = document.getElementById("examples");
const splitter = document.getElementById("splitter");
const editor = document.getElementById("example-editor");
const highlight = document.getElementById("example-highlight");
const textarea = document.getElementById("example-json");
const checkbox = document.getElementById("example-values");
const frame = document.getElementById("preview-frame");
const velocityError = document.getElementById("velocity-error");
const jsonError = document.getElementById("json-error");
const updateButton = document.getElementById("update-examples");

function applyState(state) {
  const show = state.showExamples === true;
  const wasHidden = examples.hidden;
  checkbox.checked = show;
  examples.hidden = !show;
  splitter.hidden = !show;
  frame.title = show ? "Example values" : "Template";
  if (typeof state.srcdoc === "string") {
    frame.srcdoc = state.srcdoc;
  }
  velocityError.textContent = state.error ? "Velocity error: " + state.error : "";
  jsonError.textContent = state.jsonError || "";
  if (state.replaceExamples === true && typeof state.examplesJson === "string") {
    textarea.value = state.examplesJson;
  }
  paintExamples();
  if (show && wasHidden) {
    textarea.focus();
  }
}

function paintExamples() {
  if (!editor || !highlight || !textarea) {
    return;
  }
  highlight.innerHTML = highlightJson(textarea.value) + "<br>";
  editor.classList.add("ready");
  syncExampleScroll();
}

function syncExampleScroll() {
  if (!highlight || !textarea) {
    return;
  }
  highlight.scrollTop = textarea.scrollTop;
  highlight.scrollLeft = textarea.scrollLeft;
}

function publishExamples() {
  vscode.postMessage({ command: "${UPDATE_EXAMPLE_VALUES_MESSAGE}", value: textarea.value });
}

checkbox.addEventListener("change", (event) => {
  const input = event.currentTarget;
  vscode.postMessage({ command: "${SET_EXAMPLE_VALUES_MESSAGE}", value: input.checked === true });
});
updateButton.addEventListener("click", publishExamples);
textarea.addEventListener("input", () => {
  paintExamples();
  requestAnimationFrame(syncExampleScroll);
});
textarea.addEventListener("scroll", syncExampleScroll);
textarea.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    publishExamples();
  }
});
splitter.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = examples.getBoundingClientRect().width;
  function onMove(ev) {
    const workspace = document.getElementById("workspace");
    const maxWidth = workspace ? workspace.getBoundingClientRect().width - 160 : startWidth;
    const next = Math.min(Math.max(220, startWidth + ev.clientX - startX), maxWidth);
    examples.style.width = next + "px";
  }
  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
});
window.addEventListener("message", (event) => {
  const state = event.data;
  if (!state || state.command !== "${PREVIEW_STATE_MESSAGE}") {
    return;
  }
  applyState(state);
});
paintExamples();
vscode.postMessage({ command: "${PREVIEW_READY_MESSAGE}" });
</script>
</body>
</html>`;
}

function emailDocument(bodyFragment: string, csp: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<base target="_blank">
<style>
  html, body { margin: 0; }
  body {
    background: #ffffff;
    color: #000000;
    padding: 16px;
    font-family: Arial, Helvetica, sans-serif;
  }
</style>
</head>
<body>
${bodyFragment}
</body>
</html>`;
}

function escapeAttribute(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeHtml(value: string): string {
    return escapeAttribute(value).replace(/'/g, "&#39;");
}
