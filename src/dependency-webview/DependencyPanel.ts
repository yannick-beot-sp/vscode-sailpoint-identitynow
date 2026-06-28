import * as vscode from 'vscode';
import * as commands from './app/src/services/Commands';
import { DependencyMockService } from './DependencyMockService';
import { BaseWebviewPanel } from '../webview/BaseWebviewPanel';

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `dependency-webview/assets` directory.
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dependency-webview', 'assets')]
    };
}

export class DependencyPanel extends BaseWebviewPanel {

    public static currentPanels: Map<string, DependencyPanel> = new Map();
    public static readonly viewType = 'dependencyGraphView';
    private readonly mockService = new DependencyMockService();

    public static createOrShow(extensionUri: vscode.Uri,
        tenantId: string,
        tenantName: string,
        resourceType: string,
        resourceId: string,
        label: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        const key = `${tenantId}-${resourceType}-${resourceId}`;

        // If we already have a panel for this resource, show it.
        const existing = DependencyPanel.currentPanels.get(key);
        if (existing) {
            existing._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            DependencyPanel.viewType,
            label,
            column || vscode.ViewColumn.One,
            getWebviewOptions(extensionUri)
        );

        DependencyPanel.currentPanels.set(key, new DependencyPanel(
            panel,
            extensionUri,
            key,
            tenantId,
            tenantName,
            resourceType,
            resourceId,
            label));
    }

    private constructor(panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private readonly key: string,
        private readonly tenantId: string,
        private readonly tenantName: string,
        private readonly tenantDisplayname: string,
        private readonly resourceType: string,
        private readonly resourceId: string,
        private readonly label: string) {
        super(panel, extensionUri);
    }

    public dispose(): void {
        DependencyPanel.currentPanels.delete(this.key);
        super.dispose();
    }

    protected get webviewFolderName(): string {
        return 'dependency-webview';
    }

    protected get title(): string {
        return this.label;
    }

    protected get initialData(): Record<string, unknown> {
        return {
            resourceType: this.resourceType,
            resourceId: this.resourceId,
            label: this.label
        };
    }

    protected async handleMessage(message: any): Promise<void> {
        const { command, requestId, payload } = message;
        switch (command) {
            case commands.GET_DEPENDENCY_GRAPH:
                // tenantId/tenantName are kept on the instance for the future phase where this
                // calls real ISCClient lookups instead of the mock service.
                const graph = await this.mockService.getDependencyGraph(payload.resourceType, payload.resourceId, this.label);
                this._panel.webview.postMessage({ command, requestId, payload: graph });
                return;
        }
    }
}
