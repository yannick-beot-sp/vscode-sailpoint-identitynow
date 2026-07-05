import * as vscode from 'vscode';
import * as commands from './app/src/services/Commands';
import { BaseWebviewPanel } from '../webview/BaseWebviewPanel';
import { DependencyServiceFactory } from './DependencyServiceFactory';
import { getDependencyNodeUri, getDependencyNodeUrl } from './DependencyNodeResource';
import { openPreview } from '../utils/vsCodeHelpers';

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

    public static createOrShow(extensionUri: vscode.Uri,
        tenantId: string,
        tenantName: string,
        tenantDisplayname: string,
        resourceType: string,
        resourceId: string,
        resourceName: string,
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
            tenantDisplayname,
            resourceType,
            resourceId,
            resourceName,
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
        private readonly resourceName: string,
        private readonly label: string) {
        super(panel, extensionUri);
        // BaseWebviewPanel's constructor renders the webview HTML (baking in `initialData`)
        // before the parameter properties above are assigned, so that first render serializes
        // `window.data` with everything undefined. Re-render now that the fields are set.
        this.update();
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
            resourceName: this.resourceName,
            label: this.label
        };
    }

    protected async handleMessage(message: any): Promise<void> {
        const { command, requestId, payload } = message;
        switch (command) {
            case commands.GET_DEPENDENCY_GRAPH:
                try {
                    const factory = new DependencyServiceFactory(
                        this.tenantId,
                        this.tenantName,
                        this.tenantDisplayname,
                        payload.resourceType,
                        payload.resourceId,
                        payload.resourceName,
                        this.label
                    )
                    const service = factory.getService()
                    const graph = await service.getDependencyGraph();
                    this._panel.webview.postMessage({ command, requestId, payload: graph });
                } catch (error: any) {
                    this._panel.webview.postMessage({ command, requestId, error: error?.message ?? String(error) });
                }
                return;
            case commands.VIEW_NODE_DEPENDENCIES:
                DependencyPanel.createOrShow(
                    this._extensionUri,
                    this.tenantId,
                    this.tenantName,
                    this.tenantDisplayname,
                    payload.resourceType,
                    payload.resourceId,
                    payload.resourceName,
                    payload.resourceName
                );
                return;
            case commands.OPEN_NODE_RESOURCE: {
                const uri = getDependencyNodeUri(this.tenantName, payload.node, payload.parentId);
                if (uri) {
                    await openPreview(uri);
                }
                return;
            }
            case commands.OPEN_NODE_RESOURCE_URL: {
                const url = getDependencyNodeUrl(this.tenantName, payload.node, payload.parentId);
                if (url) {
                    await vscode.env.openExternal(url);
                }
                return;
            }
        }
    }
}
