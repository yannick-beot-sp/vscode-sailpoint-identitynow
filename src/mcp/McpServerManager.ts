import * as vscode from "vscode";
import { McpServer } from "./McpServer";
import { TenantService } from "../services/TenantService";
import { TenantServiceEventType } from "../services/TenantServiceEventType";
import * as configuration from '../configurationConstants';
import { ISCMcpServerDefinitionProvider } from "./McpServerDefinitionProvider";
import { MCP_ID } from "./constants";

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

    constructor(
        private readonly context: vscode.ExtensionContext,
        tenantService: TenantService,
    ) {
        this.server = new McpServer(tenantService);

        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this))
        );

        tenantService.registerObserver(TenantServiceEventType.updateTree, this);
        tenantService.registerObserver(TenantServiceEventType.removeTenant, this);
    }

    update(_t: TenantServiceEventType, _message: unknown): void | Promise<void> {
        this.didChangeEmitter.fire();
    }

    private async onConfigurationChanged(event: vscode.ConfigurationChangeEvent): Promise<void> {
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_ENABLED_CONF}`)) {
            const mcpEnabled = isMcpEnabled();
            if (mcpEnabled && !this.server.isRunning()) {
                await this.server.start(getPreferredPort());
                savePreferredPort(this.server.port);
                await this.registerServer();
            } else if (!mcpEnabled && this.server.isRunning()) {
                await this.server.stop();
            }
        }

        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_PORT_CONF}`) && this.server.isRunning()) {
            await this.restart();
        }
    }

    async initialize(): Promise<void> {
        if (isMcpEnabled()) {
            await this.server.start(getPreferredPort());
            savePreferredPort(this.server.port);
            await this.registerServer();
        } else {
            console.log("Nothing to be done. MCP not enabled");
        }
    }

    async restart(): Promise<void> {
        if (this.server.isRunning()) {
            await this.server.stop();
        }
        if (isMcpEnabled() && isMcpApiAvailable()) {
            await this.server.start(getPreferredPort());
            savePreferredPort(this.server.port);
            await this.registerServer();
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
            );
            this.context.subscriptions.push({ dispose: () => { this.dispose(); } });
        } catch (error) {
            console.error('Failed to register MCP server definition provider:', error);
            vscode.window.showErrorMessage(`Failed to register MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    dispose(): void {
        this.server.stop().catch(() => undefined);
    }
}
