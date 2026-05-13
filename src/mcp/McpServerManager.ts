import * as vscode from "vscode";
import { isPortAvailable, McpServer } from "./McpServer";
import { TenantService } from "../services/TenantService";
import { TenantServiceEventType } from "../services/TenantServiceEventType";
import * as configuration from '../configurationConstants';
import { ISCMcpServerDefinitionProvider } from "./McpServerDefinitionProvider";
import { MCP_ID } from "./constants";
import { MCP_COPY_URL } from "../commands/constants";

/**
 * Check if MCP API is available in current VS Code version
 */
function isMcpApiAvailable(): boolean {
    return typeof vscode.lm?.registerMcpServerDefinitionProvider === 'function';
}

function isMcpEnabled(): boolean {
    const config = vscode.workspace.getConfiguration(configuration.SECTION_CONF);
    return config.get<boolean>(configuration.MCP_ENABLED_CONF, false);
}

function getPreferredPort(): number {
    const config = vscode.workspace.getConfiguration(configuration.SECTION_CONF);
    return config.get<number>(configuration.MCP_PORT_CONF, 0);
}

function savePreferredPort(port?: number): void {
    const config = vscode.workspace.getConfiguration(configuration.SECTION_CONF);
    config.update(configuration.MCP_PORT_CONF, port ?? 0);
}

/**
 * VS Code adapter that wires McpServer into the extension lifecycle:
 * reads configuration, listens to workspace events, and registers the
 * server definition with VS Code's Copilot MCP client.
 */
export class McpServerManager {
    readonly server: McpServer;
    private didChangeEmitter = new vscode.EventEmitter<void>();
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor(
        private readonly context: vscode.ExtensionContext,
        tenantService: TenantService,
    ) {
        this.server = new McpServer(tenantService);

        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.statusBarItem.text = "$(hubot)";

        context.subscriptions.push(
            vscode.commands.registerCommand(MCP_COPY_URL, () => {
                const url = `http://localhost:${this.server.port}/mcp`;
                vscode.env.clipboard.writeText(url);
                vscode.window.showInformationMessage(`MCP server URL copied: ${url}`);
            })
        );

        this.statusBarItem.command = MCP_COPY_URL;
        context.subscriptions.push(this.statusBarItem);

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this))
        );

        tenantService.registerObserver(TenantServiceEventType.updateTree, this);
        tenantService.registerObserver(TenantServiceEventType.removeTenant, this);
    }

    update(_t: TenantServiceEventType, _message: unknown): void | Promise<void> {
        this.didChangeEmitter.fire();
    }

    private async startAndRegisterServer() {
        // Get confgured port
        const preferredPort = getPreferredPort()
        let port = preferredPort
        if (preferredPort > 0 && !(await isPortAvailable(preferredPort))) {
            // If the port previously defined is taken, will determine 
            // randomly the port by setting at 0
            // This random port won't be saved for next time so we don't store it
            // NOTE: this can be the case if several instance of VSCode are started
            // We would each instance to have it's own MCP Server and not rely on other instances
            port = 0
        }
        await this.server.start(port);
        if (preferredPort <= 0) {
            savePreferredPort(this.server.port);
        }
        console.log(`MCP Server started on port ${this.server.port}`)
        this.statusBarItem.tooltip = `ISC MCP Server listening on port ${this.server.port}`;
        this.statusBarItem.show();
        await this.registerServer();
    }

    private async onConfigurationChanged(event: vscode.ConfigurationChangeEvent): Promise<void> {
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_ENABLED_CONF}`)) {
            const mcpEnabled = isMcpEnabled();
            if (mcpEnabled && !this.server.isRunning()) {
                await this.startAndRegisterServer()
            } else if (!mcpEnabled && this.server.isRunning()) {
                await this.server.stop();
                this.statusBarItem.hide();
            }
        }

        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_PORT_CONF}`) && this.server.isRunning()) {
            await this.restart();
        }
    }

    async initialize(): Promise<void> {
        if (isMcpEnabled()) {
            await this.startAndRegisterServer()
        } else {
            console.log("Nothing to be done. MCP not enabled");
        }
    }

    async restart(): Promise<void> {
        if (this.server.isRunning()) {
            await this.server.stop();
        }
        if (isMcpEnabled() && isMcpApiAvailable()) {
            await this.startAndRegisterServer()
        }
    }

    async registerServer(): Promise<void> {
        if (!isMcpApiAvailable()) {
            console.warn('MCP API is not available in this VS Code version. MCP server registration skipped.');
            return;
        }

        try {
            const mcpProvider = new ISCMcpServerDefinitionProvider(this.server);
            this.context.subscriptions.push(
                vscode.lm.registerMcpServerDefinitionProvider(MCP_ID, mcpProvider)
            )
            this.context.subscriptions.push({ dispose: () => { this.dispose(); } });
        } catch (error) {
            console.error('Failed to register MCP server definition provider:', error);
            vscode.window.showErrorMessage(`Failed to register MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    dispose(): void {
        this.server.stop().catch(() => undefined);
        this.statusBarItem.hide();
    }
}
