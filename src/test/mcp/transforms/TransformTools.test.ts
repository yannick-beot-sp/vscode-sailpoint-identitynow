/**
 * TransformTools.test.ts
 *
 * Integration tests for the MCP transform tools:
 *   - listTransforms
 *   - getTransform
 *
 * Prerequisites
 * -------------
 * 1. Copy .env.example → .env and fill in real ISC credentials.
 * 2. Run:  npm run test:mcp
 *
 * What is tested
 * --------------
 * - The server exposes all expected transform tools.
 * - listTransforms returns a valid transforms array.
 * - getTransform returns full details for the first listed transform.
 */

import * as assert from "assert";

import { McpFixture, setupMcpFixture, teardownMcpFixture, TENANT_NAME, TEST_PORT } from "../mcpTestFixture";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Transform tools – MCP integration tests", function () {
    let fixture: McpFixture;

    beforeAll(async function () {
        fixture = await setupMcpFixture(TEST_PORT);
    });

    afterAll(async function () {
        await teardownMcpFixture(fixture);
    });

    // -----------------------------------------------------------------------
    // Tool discovery
    // -----------------------------------------------------------------------

    describe("Tool list", function () {
        it("exposes all transform tools", async function () {
            const tools = await fixture.client.tools.list();
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
    });

    // -----------------------------------------------------------------------
    // listTransforms
    // -----------------------------------------------------------------------

    describe("listTransforms", function () {
        it("returns a transforms array", async function () {
            const result = await fixture.client.tools.call("listTransforms", { tenantName: TENANT_NAME });

            assert.ok(result.isSuccess, `listTransforms failed: ${result.text()}`);

            const body = result.json<{ transforms: unknown[] }>();
            assert.ok(Array.isArray(body.transforms), "result.transforms should be an array");
        });
    });

    // -----------------------------------------------------------------------
    // getTransform
    // -----------------------------------------------------------------------

    describe("getTransform", function () {
        it("returns details for the first listed transform", async function () {
            const listResult = await fixture.client.tools.call("listTransforms", { tenantName: TENANT_NAME });
            assert.ok(listResult.isSuccess, `listTransforms failed: ${listResult.text()}`);

            const { transforms } = listResult.json<{ transforms: Array<{ name: string }> }>();
            if (transforms.length === 0) {
                console.log("    (skipped – no transforms found in tenant)");
                return;
            }

            const firstName = transforms[0].name;
            const result = await fixture.client.tools.call("getTransform", {
                tenantName:    TENANT_NAME,
                transformName: firstName,
            });

            assert.ok(result.isSuccess, `getTransform failed: ${result.text()}`);

            const body = result.json<{ id: string; name: string; type: string }>();
            assert.ok(body.id,   "getTransform result should have an id");
            assert.ok(body.name, "getTransform result should have a name");
            assert.ok(body.type, "getTransform result should have a type");
        });
    });
});
