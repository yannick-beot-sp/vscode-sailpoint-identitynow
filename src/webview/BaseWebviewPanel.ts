import * as vscode from "vscode";

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Shared lifecycle/HTML-shell plumbing for the extension's Svelte-based webview panels
 * (campaign dashboard, dependency graph, ...). Each webview is its own Vite app built into
 * `<webviewFolderName>/assets/{index.js,index.css}`; this class only builds the CSP-protected
 * HTML wrapper around those assets and wires up the panel lifecycle. Anything specific to a
 * given panel (its message protocol, its own map of open instances, ...) belongs in the subclass.
 */
export abstract class BaseWebviewPanel {
    protected readonly _panel: vscode.WebviewPanel;
    protected readonly _extensionUri: vscode.Uri;
    protected _disposables: vscode.Disposable[] = [];

    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this.update();
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this.update();
                }
            },
            null,
            this._disposables
        );

        this._panel.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message),
            null,
            this._disposables
        );
    }

    /** Folder name the webview's Vite app builds into, e.g. "campaign-webview" */
    protected abstract get webviewFolderName(): string;
    /** Title shown on the panel's tab */
    protected abstract get title(): string;
    /** Serialized as `window.data` for the webview on load */
    protected abstract get initialData(): Record<string, unknown>;
    /** Handles a message sent from the webview via `postMessage` */
    protected abstract handleMessage(message: any): void | Promise<void>;

    dispose(): void {
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    protected update(): void {
        this._panel.title = this.title;
        this._panel.webview.html = this.getHtmlForWebview();
    }

    private getHtmlForWebview(): string {
        const webview = this._panel.webview;

        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, this.webviewFolderName, 'assets', 'index.js');
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, this.webviewFolderName, 'assets', 'index.css');
        const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; img-src 'self' data: ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.title}</title>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    <link href="${stylesMainUri}" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script nonce="${nonce}">
      window.data=${JSON.stringify(this.initialData)};
    </script>
  </body>
</html>`;
    }
}
