import "reflect-metadata";
import * as net from "net";
import { FrontMcpInstance } from "@frontmcp/sdk";
import { TenantService } from "../services/TenantService";
import { setTenantService, TenantResolverPlugin } from "./plugins/TenantResolverPlugin";
import { TransformApp } from "./transforms/TransformApp";
import { WorkflowApp } from "./workflows/WorkflowApp";
import { MCP_NAME, MCP_VERSION } from "./constants";

/**
 * Pure HTTP MCP server — no VS Code dependency.
 * Manages the FrontMCP instance lifecycle (start / stop).
 * Consumed by McpServerManager (VS Code adapter) and directly by tests.
 */
export class McpServer {
    private _instance?: FrontMcpInstance;
    private _port = 0;

    constructor(private readonly tenantService: TenantService) {}

    get port(): number { return this._port; }
    isRunning(): boolean { return this._instance !== undefined; }

    /**
     * Starts the FrontMCP HTTP server on the given port.
     * Pass 0 to let the OS pick a free port.
     */
    async start(port: number): Promise<void> {
        setTenantService(this.tenantService);

        const resolvedPort = port > 0 ? port : await findFreePort();

        this._instance = await FrontMcpInstance.createForGraph({
            info: { name: MCP_NAME, version: MCP_VERSION },
            apps: [TransformApp, WorkflowApp],
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
    async stop(): Promise<void> {
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
