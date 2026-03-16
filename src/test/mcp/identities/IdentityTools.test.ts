/**
 * IdentityTools.test.ts
 *
 * Integration tests for the MCP identity tools:
 *   - searchIdentities
 *   - getIdentity
 *
 * Prerequisites
 * -------------
 * 1. Copy .env.example → .env and fill in real ISC credentials.
 * 2. Set ISC_TEST_IDENTITY_ID, ISC_TEST_IDENTITY_NAME, ISC_TEST_IDENTITY_EMAIL,
 *    and ISC_TEST_IDENTITY_DISPLAY_NAME to a real identity in the tenant
 *    (all fields must be non-empty).
 * 3. Run:  npm run test:mcp
 *
 * What is tested
 * --------------
 * - searchIdentities with query "*" returns at least one identity.
 * - getIdentity with a real identity ID returns full details (all fields non-empty).
 * - getIdentity with a non-existent "dummy" identity returns an error.
 */

import * as assert from "assert";

import { McpFixture, setupMcpFixture, teardownMcpFixture, TENANT_NAME, TEST_PORT } from "../mcpTestFixture";

// ---------------------------------------------------------------------------
// Identity-specific environment variables
// ---------------------------------------------------------------------------

const TEST_IDENTITY_ID = process.env.ISC_TEST_IDENTITY_ID ?? "";
const TEST_IDENTITY_NAME = process.env.ISC_TEST_IDENTITY_NAME ?? "";
const TEST_IDENTITY_EMAIL = process.env.ISC_TEST_IDENTITY_EMAIL ?? "";
const TEST_IDENTITY_DISPLAY_NAME = process.env.ISC_TEST_IDENTITY_DISPLAY_NAME ?? "";

if (!TEST_IDENTITY_ID || !TEST_IDENTITY_NAME || !TEST_IDENTITY_EMAIL || !TEST_IDENTITY_DISPLAY_NAME) {
    throw new Error(
        "Missing identity test variables.\n" +
        "Set ISC_TEST_IDENTITY_ID, ISC_TEST_IDENTITY_NAME, ISC_TEST_IDENTITY_EMAIL, " +
        "ISC_TEST_IDENTITY_DISPLAY_NAME in .env (all must be non-empty)."
    );
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Identity tools – MCP integration tests", function () {
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
        it("exposes searchIdentities and getIdentity tools", async function () {
            const tools = await fixture.client.tools.list();
            const names = tools.map(t => t.name);

            assert.ok(names.includes("searchIdentities"), "Tool \"searchIdentities\" should be registered");
            assert.ok(names.includes("getIdentity"), "Tool \"getIdentity\" should be registered");
        });
    });

    // -----------------------------------------------------------------------
    // searchIdentities
    // -----------------------------------------------------------------------

    describe("searchIdentities", function () {
        it("query \"*\" returns at least one identity with id, name, and email", async function () {
            const result = await fixture.client.tools.call("searchIdentities", {
                tenantName: TENANT_NAME,
                query: "*",
            });

            assert.ok(result.isSuccess, `searchIdentities failed: ${result.error}`);

            const body = result.json<{ identities: Array<{ id: string; name: string; email?: string }> }>();
            assert.ok(Array.isArray(body.identities), "result.identities should be an array");
            assert.ok(body.identities.length > 0, "query \"*\" should return at least one identity");

            const first = body.identities[0];
            assert.ok(first.id, "identity should have a non-empty id");
            assert.ok(first.name, "identity should have a non-empty name");
        });

        it("query by name returns the test identity", async function () {
            const result = await fixture.client.tools.call("searchIdentities", {
                tenantName: TENANT_NAME,
                query: `name:"${TEST_IDENTITY_NAME}"`,
                limit: 1,
            });

            assert.ok(result.isSuccess, `searchIdentities failed: ${result.error}`);

            const body = result.json<{ identities: Array<{ id: string; name: string }> }>();
            assert.ok(body.identities.length === 1, `Test identity "${TEST_IDENTITY_NAME}" should appear in results`);
            assert.strictEqual(body.identities[0].name, TEST_IDENTITY_NAME, "identity name should match");
        });
    });

    // -----------------------------------------------------------------------
    // getIdentity
    // -----------------------------------------------------------------------

    describe("getIdentity", function () {
        it("returns full details for the test identity by ID (all fields non-empty)", async function () {
            const result = await fixture.client.tools.call("getIdentity", {
                tenantName: TENANT_NAME,
                identityId: TEST_IDENTITY_ID,
            });

            assert.ok(result.isSuccess, `getIdentity failed: ${result.text()}`);

            const body = result.json<{
                id: string;
                name: string;
                displayName?: string;
                email?: string;
                attributes: unknown;
                accounts: unknown[] | null;
            }>();

            assert.ok(body.id, "identity.id must be non-empty");
            assert.ok(body.name, "identity.name must be non-empty");
            assert.ok(body.displayName, "identity.displayName must be non-empty");
            assert.ok(body.email, "identity.email must be non-empty");

            assert.strictEqual(body.id, TEST_IDENTITY_ID, "identity.id should match the test value");
            assert.strictEqual(body.name, TEST_IDENTITY_NAME, "identity.name should match the test value");
            assert.strictEqual(body.email, TEST_IDENTITY_EMAIL, "identity.email should match the test value");
            assert.strictEqual(body.displayName, TEST_IDENTITY_DISPLAY_NAME, "identity.displayName should match the test value");

            assert.notStrictEqual(body.attributes, null, "identity.attributes must not be null");
            assert.ok(Array.isArray(body.accounts), "identity.accounts should be an array");
        });

        it("returns full details for the test identity by name", async function () {
            const result = await fixture.client.tools.call("getIdentity", {
                tenantName: TENANT_NAME,
                identityId: TEST_IDENTITY_NAME,
            });

            assert.ok(result.isSuccess, `getIdentity by name failed: ${result.text()}`);

            const body = result.json<{ id: string; name: string }>();
            assert.strictEqual(body.id, TEST_IDENTITY_ID, "id should match when looked up by name");
            assert.strictEqual(body.name, TEST_IDENTITY_NAME, "name should match when looked up by name");
        });

        it("returns an error for a non-existent dummy identity", async function () {
            const result = await fixture.client.tools.call("getIdentity", {
                tenantName: TENANT_NAME,
                identityId: "dummy-identity-that-does-not-exist-zzz",
            });

            assert.ok(!result.isSuccess, "getIdentity should fail for a dummy identity");
        });
    });
});
