import * as vscode from 'vscode';
import { NotificationTemplateTreeItem } from "../../models/ISCTreeItem";
import { NotificationTemplateVariable } from "./templateVariables";
import {
    MAX_EXAMPLE_JSON_CHARS,
    applyNotificationTemplateExamples,
    exampleValueMap,
    parseExampleValues,
} from "./previewExamples";
import {
    PREVIEW_READY_MESSAGE,
    PREVIEW_STATE_MESSAGE,
    SET_EXAMPLE_VALUES_MESSAGE,
    UPDATE_EXAMPLE_VALUES_MESSAGE,
    NotificationTemplatePreviewState,
    buildNotificationTemplatePreviewPage,
    buildPreviewFrameSrcdoc,
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
 * The header checkbox swaps the sandboxed body between the Velocity source and
 * a rendered template populated with catalog example values. Checking it also
 * opens a syntax-colored JSON editor of those data variables (functions excluded). Edited
 * values are applied with Update preview and do not modify the template.
 *
 * Known limits (all inherent to previewing e-mail HTML in a browser engine):
 *  - Example values cover catalogued variables and the global template tools.
 *    Identity lookups read those examples; they do not call the tenant.
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
    private readonly exampleValues = new Map<string, Record<string, unknown>>();
    private readonly jsonErrors = new Map<string, string>();
    private readonly nonces = new Map<string, string>();
    private readonly viewStates = new Map<string, NotificationTemplatePreviewState>();
    private readonly pageReady = new Set<string>();

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
                if (isPreviewReady(message)) {
                    this.postState(key);
                    return;
                }
                if (isExampleToggle(message)) {
                    this.exampleMode.set(key, message.value);
                    this.jsonErrors.delete(key);
                    await this.refresh(key, { replaceExamples: message.value });
                    return;
                }
                if (!isExampleUpdate(message)) {
                    return;
                }
                if (message.value.length > MAX_EXAMPLE_JSON_CHARS) {
                    this.reportJsonError(key, "Example values JSON is too large");
                    return;
                }
                const parsed = parseExampleValues(message.value);
                if (!parsed.ok) {
                    this.reportJsonError(key, parsed.error);
                    return;
                }
                this.jsonErrors.delete(key);
                this.exampleValues.set(key, parsed.values);
                await this.refresh(key, { replaceExamples: true });
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
                this.exampleValues.delete(key);
                this.jsonErrors.delete(key);
                this.nonces.delete(key);
                this.viewStates.delete(key);
                this.pageReady.delete(key);
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
        this.exampleValues.clear();
        this.jsonErrors.clear();
        this.nonces.clear();
        this.viewStates.clear();
        this.pageReady.clear();
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

    private async refresh(key: string, options?: { replaceExamples?: boolean }): Promise<void> {
        const panel = this.panels.get(key);
        if (!panel) {
            return;
        }
        const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(key));
        this.render(panel, document, options);
    }

    private postState(key: string): void {
        const panel = this.panels.get(key);
        const state = this.viewStates.get(key);
        if (!panel || !state) {
            return;
        }
        void panel.webview.postMessage(state);
    }

    private reportJsonError(key: string, jsonError: string): void {
        this.jsonErrors.set(key, jsonError);
        const state = this.viewStates.get(key);
        if (!state) {
            return;
        }
        const next: NotificationTemplatePreviewState = {
            ...state,
            jsonError,
            replaceExamples: false,
        };
        this.viewStates.set(key, next);
        this.postState(key);
    }

    private render(
        panel: vscode.WebviewPanel | undefined,
        document: vscode.TextDocument,
        options?: { replaceExamples?: boolean },
    ): void {
        if (!panel) {
            return;
        }
        const key = document.uri.toString();
        const source = document.getText();
        const showExamples = this.exampleMode.get(key) === true;
        let body = source;
        let error = "";
        if (showExamples) {
            try {
                body = this.withExampleValues(document, source, key);
            } catch (caught) {
                error = caught instanceof Error ? caught.message : String(caught);
            }
        }
        const state: NotificationTemplatePreviewState = {
            command: PREVIEW_STATE_MESSAGE,
            srcdoc: buildPreviewFrameSrcdoc(body),
            showExamples,
            error,
            jsonError: showExamples ? (this.jsonErrors.get(key) ?? "") : "",
            examplesJson: showExamples ? this.examplesJsonFor(document, source, key) : "",
            replaceExamples: options?.replaceExamples === true,
        };
        this.viewStates.set(key, state);
        if (!this.pageReady.has(key)) {
            panel.webview.html = buildNotificationTemplatePreviewPage({
                body,
                showExamples,
                nonce: this.nonceFor(key),
                error: error || undefined,
                jsonError: state.jsonError || undefined,
                examplesJson: state.examplesJson,
            });
            this.pageReady.add(key);
            return;
        }
        void panel.webview.postMessage(state);
    }

    private nonceFor(key: string): string {
        let nonce = this.nonces.get(key);
        if (!nonce) {
            nonce = createPreviewNonce();
            this.nonces.set(key, nonce);
        }
        return nonce;
    }

    private examplesJsonFor(document: vscode.TextDocument, source: string, key: string): string {
        const overrides = this.exampleValues.get(key);
        const values = overrides ?? exampleValueMap(this.variablesFor(document, source));
        return JSON.stringify(values, null, 2);
    }

    private withExampleValues(document: vscode.TextDocument, source: string, key: string): string {
        return applyNotificationTemplateExamples(
            source,
            this.variablesFor(document, source),
            this.exampleValues.get(key),
        );
    }

    private variablesFor(document: vscode.TextDocument, source: string): NotificationTemplateVariable[] {
        const identity = resolveTemplateIdentity(document.uri.path, document.uri.query, source);
        return completionVariables(identity).map((item) => item.variable);
    }
}

function isPreviewReady(message: unknown): message is { command: typeof PREVIEW_READY_MESSAGE } {
    return isCommand(message, PREVIEW_READY_MESSAGE);
}

function isExampleToggle(message: unknown): message is { command: typeof SET_EXAMPLE_VALUES_MESSAGE; value: boolean } {
    return isCommand(message, SET_EXAMPLE_VALUES_MESSAGE)
        && typeof (message as { value?: unknown }).value === "boolean";
}

function isExampleUpdate(message: unknown): message is { command: typeof UPDATE_EXAMPLE_VALUES_MESSAGE; value: string } {
    return isCommand(message, UPDATE_EXAMPLE_VALUES_MESSAGE)
        && typeof (message as { value?: unknown }).value === "string";
}

function isCommand(message: unknown, command: string): boolean {
    return !!message
        && typeof message === "object"
        && (message as { command?: unknown }).command === command;
}
