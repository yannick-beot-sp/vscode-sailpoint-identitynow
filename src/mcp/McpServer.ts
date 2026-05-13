import "reflect-metadata";
import * as net from "net";
import { FrontMcpInstance } from "@frontmcp/sdk";
import { TenantService } from "../services/TenantService";
import { setTenantService, TenantResolverPlugin } from "./plugins/TenantResolverPlugin";
import { IdentityApp } from "./identities/IdentityApp";
import { TransformApp } from "./transforms/TransformApp";
import { WorkflowApp } from "./workflows/WorkflowApp";
import { SourcesApp } from "./sources/SourcesApp";
import { SearchApp } from "./search/SearchApp";
import { EntitlementsApp } from "./entitlements/EntitlementsApp";
import { AccessProfilesApp } from "./accessprofiles/AccessProfilesApp";
import { RolesApp } from "./roles/RolesApp";
import { TenantApp } from "./tenants/TenantApp";
import { FormsApp } from "./forms/FormsApp";
import { IdentityProfilesApp } from "./identityprofiles/IdentityProfilesApp";
import { MCP_NAME, MCP_VERSION } from "./constants";
import { StoppableExpressAdapter } from "./StoppableExpressAdapter";

/**
 * Pure HTTP MCP server — no VS Code dependency.
 * Manages the FrontMCP instance lifecycle (start / stop).
 * Consumed by McpServerManager (VS Code adapter) and directly by tests.
 */
export class McpServer {
    private _instance?: FrontMcpInstance;
    private _adapter?: StoppableExpressAdapter;
    private _port = 0;

    constructor(private readonly tenantService: TenantService) { }

    get port(): number { return this._port; }
    isRunning(): boolean { return this._instance !== undefined; }

    /**
     * Starts the FrontMCP HTTP server on the given port.
     * Pass 0 to let the OS pick a free port.
     */
    async start(port: number): Promise<void> {
        setTenantService(this.tenantService);

        const resolvedPort = port > 0 ? port : await findFreePort();
        const adapter = new StoppableExpressAdapter();

        this._instance = await FrontMcpInstance.createForGraph({
            info: { name: MCP_NAME, version: MCP_VERSION },
            apps: [IdentityApp, TransformApp, WorkflowApp, SourcesApp, SearchApp, EntitlementsApp, AccessProfilesApp, RolesApp, FormsApp, IdentityProfilesApp, TenantApp],
            plugins: [TenantResolverPlugin],
            http: {
                port: resolvedPort,
                entryPath: "/mcp",
                hostFactory: adapter,
            },
        });

        await this._instance.start();
        this._adapter = adapter;
        this._port = resolvedPort;
    }

    /** Stops the HTTP server and resets state. */
    async stop(): Promise<void> {
        await this._adapter?.stop();
        this._adapter = undefined;
        this._instance = undefined;
        this._port = 0;
    }
}

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


export function isPortAvailable(port: number) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.once('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false); // Port is in use
            } else {
                reject(err);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(true); // Port is available
        });
        server.listen(port);
    });
}
