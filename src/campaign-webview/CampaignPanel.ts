import * as vscode from 'vscode';
import * as commands from './app/src/services/Commands';
import { ISCClient } from '../services/ISCClient';
function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'campaign-webview', 'assets')]
    };
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}



export class CampaignPanel {

    public static currentPanels: Map<string, CampaignPanel> = new Map()
    public static readonly viewType = 'campaignView';
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];


    public static createOrShow(extensionUri: vscode.Uri, tenantId: string, tenantName: string, campaignId: string, campaignName: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (CampaignPanel.currentPanels[campaignId]) {
            CampaignPanel.currentPanels[campaignId]._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            CampaignPanel.viewType,
            campaignName,
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri),
        );

        CampaignPanel.currentPanels[campaignId] = new CampaignPanel(panel, extensionUri, tenantId, tenantName, campaignId, campaignName);
    }

    public dispose() {
        for (let [key, value] of CampaignPanel.currentPanels) {
            value.dispose()
        }
        CampaignPanel.currentPanels = new Map();

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }


    /** 
     * TODO Serializer
    
    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionUri);
    }*/
    private constructor(panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private tenantId: string,
        private tenantName: string,
        private campaignId: string,
        private campaignName: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;


        this._update()
        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables
        );
        const client = new ISCClient(this.tenantId, this.tenantName)
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(async message => {
            const { command, requestId, payload } = message;
            switch (command) {
                case commands.GET_KPI_ACCESS_REVIEW:
                    const total = await client.getCertificationAccessReviewCount(this.campaignId)
                    const current = await client.getCertificationAccessReviewCount(this.campaignId, true)
                    this._panel.webview.postMessage({ command, requestId, payload: { total, current } });
                    return;
            }
        },
            null,
            this._disposables
        );
    }

    private _update() {
        const webview = this._panel.webview;
        // Set the webview's initial html content
        this._panel.title = this.campaignName;
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'campaign-webview', 'assets', 'index.js');

        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        // const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
        const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'campaign-webview', 'assets', 'index.css');

        // Uri to load styles into webview
        // const stylesResetUri = webview.asWebviewUri(styleResetPath);
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
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certification Campaign</title>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    <link href="${stylesMainUri}" rel="stylesheet">
  </head>
  <body>
    <div id="app"></div>
    <script nonce="${nonce}">
      window.data=${JSON.stringify({ campaignId: this.campaignId, campaignName: this.campaignName })};
    </script>
  </body>
</html>`;
    }
}    