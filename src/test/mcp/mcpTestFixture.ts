/**
 * mcpTestFixture.ts
 *
 * Shared fixture for MCP integration tests.
 * Provides common environment variables, a mock TenantService factory, and
 * server/client lifecycle helpers used across all MCP test suites.
 *
 * Prerequisites
 * -------------
 * Copy .env.example → .env and fill in real ISC credentials before running
 * any MCP integration test (npm run test:mcp).
 */

import "reflect-metadata";
import * as assert from "assert";
import { McpTestClient } from "@frontmcp/testing";
import { McpServer } from "../../mcp/McpServer";
import { SailPointISCAuthenticationProvider } from "../../services/AuthenticationProvider";
import { AuthenticationMethod, TenantInfo, TenantToken } from "../../models/TenantInfo";
import { TenantServiceEventType } from "../../services/TenantServiceEventType";

// ---------------------------------------------------------------------------
// Environment variables (populated from .env by dotenv/config)
// ---------------------------------------------------------------------------

export const TENANT_NAME   = process.env.ISC_TENANT_NAME   ?? "";
export const CLIENT_ID     = process.env.ISC_CLIENT_ID     ?? "";
export const CLIENT_SECRET = process.env.ISC_CLIENT_SECRET ?? "";
export const TEST_PORT     = parseInt(process.env.MCP_TEST_PORT ?? "47337", 10);

if (!TENANT_NAME || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
        "Missing required environment variables.\n" +
        "Copy .env.example to .env and set ISC_TENANT_NAME, ISC_CLIENT_ID, ISC_CLIENT_SECRET."
    );
}

// ---------------------------------------------------------------------------
// Shared TenantInfo
// ---------------------------------------------------------------------------

export const TENANT_INFO: TenantInfo = {
    id: TENANT_NAME,
    name: TENANT_NAME,
    tenantName: TENANT_NAME,
    authenticationMethod: AuthenticationMethod.personalAccessToken,
    readOnly: false,
    type: "TENANT",
};

// ---------------------------------------------------------------------------
// Mock TenantService factory
// Each call returns a fresh instance with its own token cache so suites
// running on separate ports do not share credentials.
// ---------------------------------------------------------------------------

export function createMockTenantService() {
    let _cachedToken: TenantToken | undefined;

    return {
        getTenants: () => [TENANT_INFO],
        getTenant: (_id: string) => TENANT_INFO,
        getTenantCredentials: async (_tenantId: string) => ({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
        }),
        getTenantAccessToken: async (_tenantId: string) => _cachedToken,
        setTenantAccessToken: async (_tenantId: string, token: TenantToken) => {
            _cachedToken = token;
        },
        registerObserver: (_t: TenantServiceEventType, _o: unknown) => { /* no-op */ },
        removeObserver:   (_t: TenantServiceEventType, _o: unknown) => { /* no-op */ },
    };
}

// ---------------------------------------------------------------------------
// Server + client lifecycle
// ---------------------------------------------------------------------------

export interface McpFixture {
    server: McpServer;
    client: McpTestClient;
}

/**
 * Initialises auth, starts the MCP HTTP server on `port`, and connects a
 * StreamableHTTP test client in public mode.
 * Call in `beforeAll`; pass the result to `teardownMcpFixture` in `afterAll`.
 */
export async function setupMcpFixture(port: number = TEST_PORT): Promise<McpFixture> {
    const mockTenantService = createMockTenantService();
    SailPointISCAuthenticationProvider.initialize(mockTenantService as any);

    const server = new McpServer(mockTenantService as any);
    await server.start(port);

    assert.strictEqual(server.port, port, "server should be listening on the configured port");
    assert.ok(server.isRunning(), "server should be marked as running");

    const client = await McpTestClient
        .create({ baseUrl: `http://localhost:${port}/mcp` })
        .withTransport("streamable-http")
        .withPublicMode(true)
        .buildAndConnect();

    return { server, client };
}

export async function teardownMcpFixture(fixture: McpFixture): Promise<void> {
    await fixture.client.disconnect();
    await fixture.server.stop();
}
