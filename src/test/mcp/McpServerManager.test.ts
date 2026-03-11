/**
 * McpServer.test.ts
 *
 * Integration tests for the MCP server exposed by McpServer.
 *
 * Prerequisites
 * -------------
 * 1. Copy .env.example → .env and fill in real ISC credentials.
 * 2. Run:  npm run test:mcp
 *
 * What is tested
 * --------------
 * - McpServer starts an HTTP MCP server on a fixed port (TEST_PORT).
 * - The server exposes all expected transform and workflow tools.
 * - Read-only tools (listTransforms, listWorkflows) return valid data.
 *
 * Mocking strategy
 * ----------------
 * - vscode:        not needed — McpServer has no VS Code dependency.
 * - TenantService: minimal in-memory stub; credentials come from .env.
 * - SailPointISCAuthenticationProvider: initialised with the stub so that
 *   ISCClient can obtain a real OAuth2 access token via the ISC PAT flow.
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

const TENANT_NAME   = process.env.ISC_TENANT_NAME   ?? "";
const CLIENT_ID     = process.env.ISC_CLIENT_ID     ?? "";
const CLIENT_SECRET = process.env.ISC_CLIENT_SECRET ?? "";
const TEST_PORT     = parseInt(process.env.MCP_TEST_PORT ?? "47337", 10);

if (!TENANT_NAME || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
        "Missing required environment variables.\n" +
        "Copy .env.example to .env and set ISC_TENANT_NAME, ISC_CLIENT_ID, ISC_CLIENT_SECRET."
    );
}

// ---------------------------------------------------------------------------
// Minimal TenantService stub
// ---------------------------------------------------------------------------

const TENANT_INFO: TenantInfo = {
    id: TENANT_NAME,
    name: TENANT_NAME,
    tenantName: TENANT_NAME,
    authenticationMethod: AuthenticationMethod.personalAccessToken,
    readOnly: false,
    type: "TENANT",
};

// Cache the token so subsequent tool calls skip re-authentication.
let _cachedToken: TenantToken | undefined;

const mockTenantService = {
    getTenants: () => [TENANT_INFO],
    getTenant:  (_id: string) => TENANT_INFO,
    getTenantCredentials: async (_tenantId: string) => ({
        clientId:     CLIENT_ID,
        clientSecret: CLIENT_SECRET,
    }),
    getTenantAccessToken: async (_tenantId: string) => _cachedToken,
    setTenantAccessToken: async (_tenantId: string, token: TenantToken) => {
        _cachedToken = token;
    },
    registerObserver: (_t: TenantServiceEventType, _o: unknown) => { /* no-op */ },
    removeObserver:   (_t: TenantServiceEventType, _o: unknown) => { /* no-op */ },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("McpServer – MCP integration tests", function () {
    let server: McpServer;
    let client: McpTestClient;

    // -----------------------------------------------------------------------
    // One-time setup: start the MCP HTTP server, connect the test client.
    // -----------------------------------------------------------------------
    beforeAll(async function () {
        // 1. Initialise the auth singleton so ISCClient can obtain tokens.
        SailPointISCAuthenticationProvider.initialize(mockTenantService as any);

        // 2. Create and start the server on the fixed test port.
        server = new McpServer(mockTenantService as any);
        await server.start(TEST_PORT);

        assert.strictEqual(server.port, TEST_PORT, "server should be listening on the configured port");
        assert.ok(server.isRunning(), "server should be marked as running");

        // 3. Connect the test client (public mode: the server has no auth layer).
        client = await McpTestClient
            .create({ baseUrl: `http://localhost:${TEST_PORT}/mcp` })
            .withTransport("streamable-http")
            .withPublicMode(true)
            .buildAndConnect();
    });

    // -----------------------------------------------------------------------
    // Cleanup
    // -----------------------------------------------------------------------
    afterAll(async function () {
        await client.disconnect();
        await server.stop();
    });

    // -----------------------------------------------------------------------
    // Tool discovery
    // -----------------------------------------------------------------------
    describe("Tool list", function () {
        it("exposes all transform tools", async function () {
            const tools = await client.tools.list();
            const names = tools.map(t => t.name);

            const expected = [
                "listTransforms",
                "getTransform",
                "createTransform",
                "updateTransform",
                "deleteTransform",
                "evaluateTransform",
            ];

            for (const name of expected) {
                assert.ok(names.includes(name), `Tool "${name}" should be registered`);
            }
        });

        it("exposes all workflow tools", async function () {
            const tools = await client.tools.list();
            const names = tools.map(t => t.name);

            const expected = [
                "listWorkflows",
                "getWorkflow",
                "createWorkflow",
                "updateWorkflow",
                "deleteWorkflow",
                "setWorkflowStatus",
            ];

            for (const name of expected) {
                assert.ok(names.includes(name), `Tool "${name}" should be registered`);
            }
        });
    });

    // -----------------------------------------------------------------------
    // Tool execution – read-only calls that must succeed with real data
    // -----------------------------------------------------------------------
    describe("Tool execution", function () {
        it("listTransforms returns a transforms array", async function () {
            const result = await client.tools.call("listTransforms", { tenantName: TENANT_NAME });

            assert.ok(result.isSuccess, `listTransforms failed: ${result.text()}`);

            const body = result.json<{ transforms: unknown[] }>();
            assert.ok(Array.isArray(body.transforms), "result.transforms should be an array");
        });

        it("listWorkflows returns a workflows array", async function () {
            const result = await client.tools.call("listWorkflows", { tenantName: TENANT_NAME });

            assert.ok(result.isSuccess, `listWorkflows failed: ${result.text()}`);

            const body = result.json<{ workflows: unknown[] }>();
            assert.ok(Array.isArray(body.workflows), "result.workflows should be an array");
        });

        it("getTransform returns details for the first listed transform", async function () {
            const listResult = await client.tools.call("listTransforms", { tenantName: TENANT_NAME });
            assert.ok(listResult.isSuccess, `listTransforms failed: ${listResult.text()}`);

            const { transforms } = listResult.json<{ transforms: Array<{ name: string }> }>();
            if (transforms.length === 0) {
                console.log("    (skipped – no transforms found in tenant)");
                return;
            }

            const firstName = transforms[0].name;
            const result = await client.tools.call("getTransform", {
                tenantName:    TENANT_NAME,
                transformName: firstName,
            });

            assert.ok(result.isSuccess, `getTransform failed: ${result.text()}`);

            const body = result.json<{ id: string; name: string; type: string }>();
            assert.ok(body.id,   "getTransform result should have an id");
            assert.ok(body.name, "getTransform result should have a name");
            assert.ok(body.type, "getTransform result should have a type");
        });

        it("getWorkflow returns details for the first listed workflow", async function () {
            const listResult = await client.tools.call("listWorkflows", { tenantName: TENANT_NAME });
            assert.ok(listResult.isSuccess, `listWorkflows failed: ${listResult.text()}`);

            const { workflows } = listResult.json<{ workflows: Array<{ name: string }> }>();
            if (workflows.length === 0) {
                console.log("    (skipped – no workflows found in tenant)");
                return;
            }

            const firstName = workflows[0].name;
            const result = await client.tools.call("getWorkflow", {
                tenantName:   TENANT_NAME,
                workflowName: firstName,
            });

            assert.ok(result.isSuccess, `getWorkflow failed: ${result.text()}`);

            const body = result.json<{ id: string; name: string; enabled: boolean }>();
            assert.ok(body.id,              "getWorkflow result should have an id");
            assert.ok(body.name,            "getWorkflow result should have a name");
            assert.ok(typeof body.enabled === "boolean", "getWorkflow result.enabled should be boolean");
        });
    });
});
