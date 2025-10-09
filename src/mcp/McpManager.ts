import * as vscode from 'vscode';
import * as configuration from '../configurationConstants';
import { IscMcpServer, IscMcpServerConfig } from 'isc-mcp-server'
import { TenantService } from '../services/TenantService';
import { VSCodeTenantManager } from './VSCodeTenantManager';


export class McpManager {
    private mcpServer: IscMcpServer | null = null;
    private didChangeEmitter = new vscode.EventEmitter<void>();

    constructor(private readonly context: vscode.ExtensionContext,
        private readonly tenantService: TenantService
    ) {
        this.context = context;

        // Listen for configuration changes
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this))
        );
    }

    async initialize(): Promise<void> {
        // Check if MCP server should be started based on configuration
        if (this.isMcpEnabled()) {
            await this.startMcpServer();
            // Register the MCP server definition provider first
            await this.registerServer();
        } else {
            console.log("Nothing to be done. MCP not enabled");

        }
    }


    private isMcpEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(configuration.SECTION_CONF);
        return config.get<boolean>(configuration.MCP_ENABLED, false);
    }
    private getPreferredPort(): number {
        const config = vscode.workspace.getConfiguration(configuration.SECTION_CONF);
        return config.get<number>(configuration.MCP_PORT, 0);
    }

    /**
    * Check if MCP API is available in current VS Code version
    */
    private isMcpApiAvailable(): boolean {
        return typeof vscode.lm?.registerMcpServerDefinitionProvider === 'function';
    }


    private async onConfigurationChanged(event: vscode.ConfigurationChangeEvent): Promise<void> {

        // Handle MCP server enable/disable
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_ENABLED}`)) {
            const mcpEnabled = this.isMcpEnabled();

            if (mcpEnabled && !this.mcpServer) {
                // MCP was enabled, start server
                await this.startMcpServer();
            } else if (!mcpEnabled && this.mcpServer) {
                // MCP was disabled, stop server
                await this.stopMcpServer();
            }
        }

        // Handle port changes - restart server if port configuration changed
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_PORT}`) && this.mcpServer) {
            await this.restart();
        }
    }
    private async startMcpServer(): Promise<void> {
        if (this.mcpServer) {
            return; // Already running
        }

        // Check if MCP API is available before proceeding
        if (!this.isMcpApiAvailable()) {
            console.error('MCP API not available, skipping MCP initialization');
            return;
        }
        const port = this.getPreferredPort()

        const config: IscMcpServerConfig = {
            mode: "http",
            port,
            iscTenantManager: new VSCodeTenantManager(this.tenantService)
        }
        this.mcpServer = new IscMcpServer(config)

    }

    private async stopMcpServer(): Promise<void> {
        if (!this.mcpServer) {
            return; // Not running
        }

        try {
            await this.mcpServer.stop();
            this.mcpServer = null;

            console.log('ISC MCP Server stopped successfully');
            //*vscode.window.showInformationMessage('ISC MCP Server stopped');

            // Trigger server definitions update
            this.didChangeEmitter.fire();

        } catch (error) {
            console.error('Failed to stop ISC MCP Server:', error);
            vscode.window.showErrorMessage(`Failed to stop ISC MCP Server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }


    async restart(): Promise<void> {
        if (this.mcpServer) {
            await this.stopMcpServer();
        }

        if (this.isMcpEnabled() && this.isMcpApiAvailable()) {
            await this.startMcpServer();
            await this.registerServer();
        }
    }



    /**
     * Register the MCP server with VS Code
     */
    async registerServer(): Promise<void> {
        // Check if MCP API is available
        if (!this.isMcpApiAvailable()) {
            console.warn('MCP API is not available in this VS Code version. MCP server registration skipped.');
            return;
        }

        try {
            this.context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider('isc-mcp-server', {
                onDidChangeMcpServerDefinitions: this.didChangeEmitter.event,
                provideMcpServerDefinitions: async () => {
                    let servers: vscode.McpServerDefinition[] = [];

                    // Only register when server is running
                    if (this.mcpServer && this.mcpServer.isRunning()) {
                        const serverStatus = this.mcpServer.getServerStatus();
                        if (serverStatus.mcpUrl) {
                            servers.push(new vscode.McpHttpServerDefinition(
                                'isc-mcp-server',
                                vscode.Uri.parse(serverStatus.mcpUrl),
                                {
                                    // eslint-disable-next-line @typescript-eslint/naming-convention
                                    'Content-Type': 'application/json',
                                },
                                "1.0.0"
                            ));
                        }
                    }

                    return servers;
                },
                resolveMcpServerDefinition: async (server: vscode.McpServerDefinition) => {
                    if (server.label === 'isc-mcp-server') {
                        // Ensure server is running
                        if (!this.mcpServer || !this.mcpServer.isRunning()) {
                            throw new Error('ISC MCP Server is not running');
                        }
                    }
                    return server;
                }
            }))

        } catch (error) {
            console.error('Failed to register MCP server definition provider:', error);
            vscode.window.showErrorMessage(`Failed to register MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}