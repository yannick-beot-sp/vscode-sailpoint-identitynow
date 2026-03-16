/**
 * WorkflowTools.test.ts
 *
 * Integration tests for the MCP workflow tools:
 *   - listWorkflows
 *   - getWorkflow
 *
 * Prerequisites
 * -------------
 * 1. Copy .env.example → .env and fill in real ISC credentials.
 * 2. Run:  npm run test:mcp
 *
 * What is tested
 * --------------
 * - The server exposes all expected workflow tools.
 * - listWorkflows returns a valid workflows array.
 * - getWorkflow returns full details for the first listed workflow.
 */

import * as assert from "assert";

import { McpFixture, setupMcpFixture, teardownMcpFixture, TENANT_NAME, TEST_PORT } from "../mcpTestFixture";
import { isEmpty } from "../../../utils/stringUtils";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("Workflow tools – MCP integration tests", function () {
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
        it("exposes all workflow tools", async function () {
            const tools = await fixture.client.tools.list();
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
    // listWorkflows
    // -----------------------------------------------------------------------

    describe("listWorkflows", function () {
        it("returns a workflows array", async function () {
            const result = await fixture.client.tools.call("listWorkflows", { tenantName: TENANT_NAME });

            assert.ok(result.isSuccess, `listWorkflows failed: ${result.text()}`);

            const body = result.json<{ workflows: unknown[] }>();
            assert.ok(Array.isArray(body.workflows), "result.workflows should be an array");
        });
    });

    // -----------------------------------------------------------------------
    // getWorkflow
    // -----------------------------------------------------------------------

    describe("createWorkflow and getWorkflow and deleteWorkflow", function () {
        it("create and delete a workflow", async function () {
            const workflowName = "UnitTest Workflow1"
            const createResult = await fixture.client.tools.call("createWorkflow", {
                tenantName: TENANT_NAME,
                "name": workflowName,
                "definition": {
                    "start": "success",
                    "steps": {
                        "success": {
                            "actionId": "sp:operator-success",
                            "description": "Workflow terminé avec succès.",
                            "type": "success"
                        }
                    }
                },
                "trigger": {
                    "type": "EVENT",
                    "attributes": {
                        "id": "idn:identity-attributes-changed"
                    }
                }
            });
            assert.ok(createResult.isSuccess, `createWorkflow failed: ${createResult.text()}`);

            const createResultBody = createResult.json<{ id: string; status: string }>();
            assert.ok(createResultBody.id, "createWorkflow result should have an id");
            assert.ok(createResultBody.status, "createWorkflow result should have a status");


            const getResult = await fixture.client.tools.call("getWorkflow", {
                tenantName: TENANT_NAME,
                workflowName,
            });
            assert.ok(getResult.isSuccess, `getWorkflow failed: ${getResult.text()}`);
            const getResultBody = getResult.json<{ id: string; name: string; enabled: boolean }>();

            assert.ok(getResultBody.id == createResultBody.id, `getWorkflow should have same id as createWorkflow`);
            assert.ok(getResultBody.name == workflowName, `getWorkflow should have same name`);
            assert.ok(typeof getResultBody.enabled === "boolean", "getWorkflow result.enabled should be boolean");
            assert.ok(!getResultBody.enabled, "getWorkflow enabled should be false");


            const deleteResult = await fixture.client.tools.call("deleteWorkflow", {
                tenantName: TENANT_NAME,
                workflowName,
            });
            assert.ok(deleteResult.isSuccess, `deleteWorkflow failed: ${deleteResult.text()}`);
            const deleteResultBody = deleteResult.json<{ status: string }>();
            assert.ok(deleteResultBody.status === "deleted", "deleteWorkflow result should have a status");

        });
    });
});
