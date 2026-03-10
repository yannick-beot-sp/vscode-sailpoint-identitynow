import "reflect-metadata";
import * as net from "net";
import * as vscode from "vscode";
import { FrontMcpInstance } from "@frontmcp/sdk";
import { TenantService, TenantServiceEventType } from "../services/TenantService";
import { setTenantService, TenantResolverPlugin } from "./plugins/TenantResolverPlugin";
import { TransformApp } from "./transforms/TransformApp";
import * as configuration from '../configurationConstants';
import { ISCMcpServerDefinitionProvider } from "./McpServerDefinitionProvider";
import { MCP_ID, MCP_NAME, MCP_VERSION } from "./constants";


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
 * Manages the FrontMCP server lifecycle.
 * Starts / stops the HTTP server and fires an event when the port changes
 * so that the VS Code MCP provider can update its registration.
 */
export class McpServerManager {
    private _instance?: FrontMcpInstance;
    private didChangeEmitter = new vscode.EventEmitter<void>();
    private _port = 0;

    constructor(private readonly context: vscode.ExtensionContext,
        private readonly tenantService: TenantService) {
        // Listen for configuration changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(this.onConfigurationChanged.bind(this))
        );

        tenantService.registerObserver(TenantServiceEventType.updateTree, this)
        tenantService.registerObserver(TenantServiceEventType.removeTenant, this)
    }
    update(t: TenantServiceEventType, message: any): void | Promise<void> {
        // If any update in the list of nodes in the tree view (could be a container or a tenant)
        // or tenant is removed, let's update the MCP configuration
        this.didChangeEmitter.fire()
    }


    private async onConfigurationChanged(event: vscode.ConfigurationChangeEvent): Promise<void> {

        // Handle MCP server enable/disable
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_ENABLED_CONF}`)) {
            const mcpEnabled = isMcpEnabled();

            if (mcpEnabled && !this._instance) {
                // MCP was enabled, start server
                await this.startMcpServer();
                await this.registerServer();
            } else if (!mcpEnabled && this._instance) {
                // MCP was disabled, stop server
                await this.stopMcpServer();
            }
        }

        // Handle port changes - restart server if port configuration changed
        if (event.affectsConfiguration(`${configuration.SECTION_CONF}.${configuration.MCP_PORT_CONF}`) && this._instance) {
            await this.restart();
        }
    }

    async initialize(): Promise<void> {
        // Check if MCP server should be started based on configuration
        if (isMcpEnabled()) {
            await this.startMcpServer();
            await this.registerServer();

        } else {
            console.log("Nothing to be done. MCP not enabled");

        }
    }
    async restart(): Promise<void> {
        if (this._instance) {
            await this.stopMcpServer();
        }

        if (isMcpEnabled() && isMcpApiAvailable()) {
            await this.startMcpServer();
            await this.registerServer();
        }
    }

    get port(): number { return this._port; }
    isRunning(): boolean { return this._instance !== undefined; }

    /**
     * Starts the FrontMCP HTTP server.
     */
    async startMcpServer(): Promise<void> {

        setTenantService(this.tenantService);

        let resolvedPort = getPreferredPort();
        if (resolvedPort <= 0) {
            resolvedPort = await findFreePort()
            savePreferredPort(resolvedPort)
        }

        // createForGraph accepts FrontMcpConfigInput (un-parsed), initialises
        // all scopes, but does NOT start the HTTP server — we call start() ourselves.
        this._instance = await FrontMcpInstance.createForGraph({
            info: { name: MCP_NAME, version: MCP_VERSION },
            apps: [TransformApp],
            plugins: [TenantResolverPlugin],
            http: {
                port: resolvedPort,
                entryPath: "/mcp",
            },
        });

        await this._instance.start();

        this._port = resolvedPort;
    }

    /** Stops the HTTP server and resets state. */
    async stopMcpServer(): Promise<void> {
        // TODO kill HTTP server
        this._instance = undefined;
        this._port = 0;
    }

    /**
  * Register the MCP server with VS Code
  */
    async registerServer(): Promise<void> {
        // Check if MCP API is available
        if (!isMcpApiAvailable()) {
            console.warn('MCP API is not available in this VS Code version. MCP server registration skipped.');
            return;
        }

        try {
            const mcpProvider = new ISCMcpServerDefinitionProvider(this);
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
        this.stopMcpServer().catch(() => undefined);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Finds a free TCP port on localhost by letting the OS assign one. */
function findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, "127.0.0.1", () => {
            const port = (server.address() as net.AddressInfo).port;
            server.close(err => (err ? reject(err) : resolve(port)));
        });
        server.on("error", reject);
    });
}
