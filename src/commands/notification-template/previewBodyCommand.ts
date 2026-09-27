import * as vscode from 'vscode';
import { NotificationTemplateTreeItem } from "../../models/ISCTreeItem";
import { applyNotificationTemplateExamples } from "./previewExamples";
import {
    SET_EXAMPLE_VALUES_MESSAGE,
    buildNotificationTemplatePreviewPage,
    createPreviewNonce,
} from "./previewHtml";
import { completionVariables, resolveTemplateIdentity } from "./templateVariableCompletion";

const TEMPLATES_SEGMENT = "/notification-templates/";
const BODY_SEGMENT = "/notification-template-body/";
const RENDER_DEBOUNCE_MS = 200;

/**
 * Shows a live-updating rendered preview of a notification template `body`
 * beside the editor. One webview panel per body URI, re-rendered on every edit.
 *
 * The header checkbox swaps the sandboxed body between the Velocity template
 * and catalog example values. The template itself is not modified.
 *
 * Known limits (all inherent to previewing e-mail HTML in a browser engine):
 *  - Example values cover catalogued variables only. Function calls and
 *    directives (`#if`, `#foreach`) are left as written.
 *  - Scripts in the template are blocked; remote images load over https only.
 *  - Outlook-only `<!--[if mso]>` blocks are treated as comments, i.e. hidden.
 */
export class PreviewNotificationTemplateBodyCommand {
    static readonly viewType = "iscNotificationTemplateBodyPreview";

    private readonly panels = new Map<string, vscode.WebviewPanel>();
    private readonly changeListeners = new Map<string, vscode.Disposable>();
    private readonly messageListeners = new Map<string, vscode.Disposable>();
    private readonly renderTimers = new Map<string, NodeJS.Timeout>();
    private readonly exampleMode = new Map<string, boolean>();

    /**
     * A preview panel is derived from an open body editor and keeps no
     * restorable URI. Rather than let VS Code restore a dead, un-wired panel
     * after a window reload, drop it - the user reopens the preview from the
     * editor title bar.
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
                { enableScripts: true, enableFindWidget: true, retainContextWhenHidden: true }
            );
            this.panels.set(key, panel);

            const messageListener = panel.webview.onDidReceiveMessage(async (message: unknown) => {
                if (!isExampleToggle(message)) {
                    return;
                }
                this.exampleMode.set(key, message.value);
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.parse(key));
                this.render(this.panels.get(key), doc);
            });
            this.messageListeners.set(key, messageListener);

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
                    this.render(this.panels.get(key), event.document);
                }, RENDER_DEBOUNCE_MS));
            });
            this.changeListeners.set(key, listener);

            panel.onDidDispose(() => {
                this.panels.delete(key);
                this.exampleMode.delete(key);
                this.changeListeners.get(key)?.dispose();
                this.changeListeners.delete(key);
                this.messageListeners.get(key)?.dispose();
                this.messageListeners.delete(key);
                const timer = this.renderTimers.get(key);
                if (timer) {
                    clearTimeout(timer);
                    this.renderTimers.delete(key);
                }
            });
        }

        const document = await vscode.workspace.openTextDocument(bodyUri);
        this.render(panel, document);
    }

    dispose(): void {
        for (const timer of this.renderTimers.values()) {
            clearTimeout(timer);
        }
        for (const listener of this.changeListeners.values()) {
            listener.dispose();
        }
        for (const listener of this.messageListeners.values()) {
            listener.dispose();
        }
        for (const panel of this.panels.values()) {
            panel.dispose();
        }
        this.renderTimers.clear();
        this.changeListeners.clear();
        this.messageListeners.clear();
        this.exampleMode.clear();
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

    private render(panel: vscode.WebviewPanel | undefined, document: vscode.TextDocument): void {
        if (!panel) {
            return;
        }
        const source = document.getText();
        const showExamples = this.exampleMode.get(document.uri.toString()) === true;
        const body = showExamples ? this.withExampleValues(document, source) : source;
        panel.webview.html = buildNotificationTemplatePreviewPage({
            body,
            showExamples,
            nonce: createPreviewNonce(),
        });
    }

    private withExampleValues(document: vscode.TextDocument, source: string): string {
        const identity = resolveTemplateIdentity(document.uri.path, document.uri.query, source);
        const variables = completionVariables(identity).map((item) => item.variable);
        return applyNotificationTemplateExamples(source, variables);
    }
}

function isExampleToggle(message: unknown): message is { command: typeof SET_EXAMPLE_VALUES_MESSAGE; value: boolean } {
    return !!message
        && typeof message === "object"
        && (message as { command?: unknown }).command === SET_EXAMPLE_VALUES_MESSAGE
        && typeof (message as { value?: unknown }).value === "boolean";
}
