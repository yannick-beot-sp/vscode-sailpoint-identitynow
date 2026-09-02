import * as vscode from 'vscode';
import { NotificationTemplateTreeItem } from "../../models/ISCTreeItem";

const TEMPLATES_SEGMENT = "/notification-templates/";
const BODY_SEGMENT = "/notification-template-body/";
const RENDER_DEBOUNCE_MS = 200;

/**
 * Shows a live-updating rendered preview of a notification template `body`
 * beside the editor. One webview panel per body URI, re-rendered on every edit.
 *
 * Known limits (all inherent to previewing e-mail HTML in a browser engine):
 *  - Velocity placeholders (`${x}`, `$!{x}`, `$x`) are shown literally.
 *  - Scripts are blocked; remote images load over https only.
 *  - Outlook-only `<!--[if mso]>` blocks are treated as comments, i.e. hidden.
 */
export class PreviewNotificationTemplateBodyCommand {
    static readonly viewType = "iscNotificationTemplateBodyPreview";

    private readonly panels = new Map<string, vscode.WebviewPanel>();
    private readonly changeListeners = new Map<string, vscode.Disposable>();
    private readonly renderTimers = new Map<string, NodeJS.Timeout>();

    /**
     * A preview panel is derived from an open body editor and keeps no
     * restorable state (the webview runs no scripts, so it cannot persist its
     * URI). Rather than let VS Code restore a dead, un-wired panel after a window
     * reload, drop it - the user reopens the preview from the editor title bar.
     */
    registerSerializer(): vscode.Disposable {
        return vscode.window.registerWebviewPanelSerializer(
            PreviewNotificationTemplateBodyCommand.viewType,
            {
                deserializeWebviewPanel: async (panel: vscode.WebviewPanel) => {
                    panel.dispose();
                }
            }
        );
    }

    async execute(arg?: NotificationTemplateTreeItem | vscode.Uri): Promise<void> {
        const bodyUri = this.resolveBodyUri(arg);
        if (!bodyUri) {
            throw new Error("PreviewNotificationTemplateBodyCommand: no notification template body to preview");
        }
        const key = bodyUri.toString();

        let panel = this.panels.get(key);
        if (panel) {
            panel.reveal(vscode.ViewColumn.Beside, true);
        } else {
            panel = vscode.window.createWebviewPanel(
                PreviewNotificationTemplateBodyCommand.viewType,
                this.titleFor(bodyUri),
                { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
                { enableScripts: false, enableFindWidget: true, retainContextWhenHidden: true }
            );
            this.panels.set(key, panel);

            const listener = vscode.workspace.onDidChangeTextDocument(event => {
                if (event.document.uri.toString() !== key) {
                    return;
                }
                const existing = this.renderTimers.get(key);
                if (existing) {
                    clearTimeout(existing);
                }
                this.renderTimers.set(key, setTimeout(() => {
                    this.renderTimers.delete(key);
                    this.render(this.panels.get(key), event.document.getText());
                }, RENDER_DEBOUNCE_MS));
            });
            this.changeListeners.set(key, listener);

            panel.onDidDispose(() => {
                this.panels.delete(key);
                this.changeListeners.get(key)?.dispose();
                this.changeListeners.delete(key);
                const timer = this.renderTimers.get(key);
                if (timer) {
                    clearTimeout(timer);
                    this.renderTimers.delete(key);
                }
            });
        }

        const document = await vscode.workspace.openTextDocument(bodyUri);
        this.render(panel, document.getText());
    }

    dispose(): void {
        for (const timer of this.renderTimers.values()) {
            clearTimeout(timer);
        }
        for (const listener of this.changeListeners.values()) {
            listener.dispose();
        }
        for (const panel of this.panels.values()) {
            panel.dispose();
        }
        this.renderTimers.clear();
        this.changeListeners.clear();
        this.panels.clear();
    }

    private resolveBodyUri(arg?: NotificationTemplateTreeItem | vscode.Uri): vscode.Uri | undefined {
        if (arg instanceof vscode.Uri) {
            return this.toBodyUri(arg);
        }
        if (arg && typeof arg === "object" && "uri" in arg && arg.uri instanceof vscode.Uri) {
            return this.toBodyUri(arg.uri);
        }
        const active = vscode.window.activeTextEditor?.document.uri;
        return active ? this.toBodyUri(active) : undefined;
    }

    private toBodyUri(uri: vscode.Uri): vscode.Uri | undefined {
        if (uri.scheme !== "idn") {
            return undefined;
        }
        if (uri.path.includes(BODY_SEGMENT)) {
            return uri;
        }
        if (uri.path.includes(TEMPLATES_SEGMENT)) {
            return uri.with({ path: uri.path.replace(TEMPLATES_SEGMENT, BODY_SEGMENT) });
        }
        return undefined;
    }

    private titleFor(bodyUri: vscode.Uri): string {
        const raw = bodyUri.path.split("/").pop() ?? "body";
        let name = raw;
        try {
            name = decodeURIComponent(raw);
        } catch {
            // keep the raw segment if it is not valid percent-encoding
        }
        return `Preview: ${name}`;
    }

    private render(panel: vscode.WebviewPanel | undefined, bodyFragment: string): void {
        if (!panel) {
            return;
        }
        const csp = [
            "default-src 'none'",
            "img-src https: data:",
            "style-src 'unsafe-inline' https:",
            "font-src https: data:",
            "media-src https:",
        ].join("; ");

        panel.webview.html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<base target="_blank">
<style>
  html, body { margin: 0; }
  body {
    /* e-mail bodies are authored for a white canvas, regardless of VS Code theme */
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
}
