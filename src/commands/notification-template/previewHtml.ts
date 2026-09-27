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

export function createPreviewNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Preview shell: a header checkbox above a sandboxed copy of the e-mail.
 *
 * The checkbox script is the only script allowed to run. The template body is
 * an escaped srcdoc, so it cannot close this document or inherit the nonce.
 */
export function buildNotificationTemplatePreviewPage(options: {
    body: string;
    showExamples: boolean;
    nonce: string;
}): string {
    const { body, showExamples, nonce } = options;
    const parentCsp = [
        "default-src 'none'",
        "img-src https: data:",
        "style-src 'unsafe-inline' https:",
        "font-src https: data:",
        "media-src https:",
        `script-src 'nonce-${nonce}'`,
        "frame-src about:",
    ].join("; ");
    const srcdoc = emailDocument(body, EMAIL_FRAME_CSP);

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
  iframe { flex: 1; width: 100%; border: 0; background: #ffffff; }
</style>
</head>
<body>
<header>
<label><input id="example-values" type="checkbox"${showExamples ? " checked" : ""}> Example values</label>
</header>
<iframe title="${showExamples ? "Example values" : "Template"}" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer" srcdoc="${escapeAttribute(srcdoc)}"></iframe>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
document.getElementById("example-values").addEventListener("change", (event) => {
  const input = event.currentTarget;
  vscode.postMessage({ command: "${SET_EXAMPLE_VALUES_MESSAGE}", value: input.checked === true });
});
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
