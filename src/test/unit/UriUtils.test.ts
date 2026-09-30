import * as assert from "assert";
import { describe, it } from "mocha";
import { Uri } from "vscode";
import {
    buildResourceUri,
    getIdByUri,
    getNameByUri,
    getPathByUri,
    getProvisioningPolicyUri,
    getResourceUri,
    getWorkflowExecutionDetailUri,
} from "../../utils/UriUtils.js";

const TENANT = "company10352-poc.identitynow-demo.com";
const TENANT_ID = "8b1c0e2a4d5f67890123456789abcdef";

suite("UriUtils Test Suite", () => {
    describe("service-versioned resource URIs", () => {
        it("uses the tenant hostname as authority and keeps the name last", () => {
            const id = "2c9180835d191a86015d28455b4a2329";
            const uri = getResourceUri(TENANT, "access-profiles", id, "Employees");

            assert.strictEqual(uri.scheme, "idn");
            assert.strictEqual(uri.authority, TENANT);
            assert.notStrictEqual(uri.authority, TENANT_ID);
            assert.strictEqual(uri.path, `/${TENANT}/access-profiles/v1/${id}/Employees`);
            assert.strictEqual(getNameByUri(uri), "Employees");
            assert.strictEqual(getIdByUri(uri), id);
            assert.strictEqual(getPathByUri(uri), `/access-profiles/v1/${id}`);
        });

        it("encodes slashes in the name without moving the id", () => {
            const id = "transform-id";
            const uri = getResourceUri(TENANT, "transforms", id, "A/B");

            assert.strictEqual(uri.path, `/${TENANT}/transforms/v1/${id}/A%2FB`);
            assert.strictEqual(getIdByUri(uri), id);
            assert.strictEqual(getPathByUri(uri), `/transforms/v1/${id}`);
        });

        it("places the version after the first segment of a nested resource type", () => {
            const uri = getResourceUri(
                TENANT,
                "accounts/search-attribute-config",
                "department",
                "Department"
            );

            assert.strictEqual(
                uri.path,
                `/${TENANT}/accounts/v1/search-attribute-config/department/Department`
            );
            assert.strictEqual(
                getPathByUri(uri),
                "/accounts/v1/search-attribute-config/department"
            );
            assert.strictEqual(getIdByUri(uri), "department");
        });

        it("keeps privilege criteria on the versioned config path", () => {
            const id = "criteria-config-id";
            const uri = buildResourceUri({
                tenantName: TENANT,
                resourceType: "criteria-config/privilege",
                id,
                name: "Privilege Classification",
            });

            assert.strictEqual(uri.authority, TENANT);
            assert.strictEqual(
                getPathByUri(uri),
                `/criteria-config/v1/privilege/${id}`
            );
            assert.strictEqual(getNameByUri(uri), "Privilege Classification");
        });

        it("omits a missing id for singleton configuration", () => {
            const uri = getResourceUri(TENANT, "org-config", null as unknown as string, "Organization Configuration");

            assert.strictEqual(uri.path, `/${TENANT}/org-config/v1/Organization Configuration`);
            assert.strictEqual(getPathByUri(uri), "/org-config/v1");
        });

        it("opens access request configuration on the current v2 contract", () => {
            const uri = getResourceUri(
                TENANT,
                "access-request-config",
                null as unknown as string,
                "Access Request Configuration"
            );

            assert.strictEqual(getPathByUri(uri), "/access-request-config/v2");
            assert.strictEqual(getNameByUri(uri), "Access Request Configuration");
        });

        it("builds a source schema collection path from the source URI", () => {
            const sourceId = "4aa7b635a5da4f58bfa688a2ffdbaa88";
            const sourceUri = getResourceUri(TENANT, "sources", sourceId, "HR");

            assert.strictEqual(getIdByUri(sourceUri), sourceId);
            assert.strictEqual(getPathByUri(sourceUri) + "/schemas", `/sources/v1/${sourceId}/schemas`);
        });

        it("keeps the execution id as the tab title of a workflow history URI", () => {
            const executionId = "exec-1";
            const uri = getWorkflowExecutionDetailUri(TENANT, executionId);

            assert.strictEqual(uri.authority, TENANT);
            assert.strictEqual(
                uri.path,
                `/${TENANT}/workflow-executions/v1/${executionId}/history/${executionId}`
            );
            assert.strictEqual(getNameByUri(uri), executionId);
            assert.strictEqual(
                getPathByUri(uri),
                `/workflow-executions/v1/${executionId}/history`
            );
        });

        it("still parses a URI written before the tenant segment existed", () => {
            const id = "2c9180835d191a86015d28455b4a2329";
            const uri = Uri.from({
                scheme: "idn",
                authority: TENANT,
                path: `/access-profiles/v1/${id}/Employees`,
            });

            assert.strictEqual(getIdByUri(uri), id);
            assert.strictEqual(getNameByUri(uri), "Employees");
            assert.strictEqual(getPathByUri(uri), `/access-profiles/v1/${id}`);
        });

        it("still parses a Sources V2 provisioning policy URI", () => {
            const sourceId = "4aa7b635a5da4f58bfa688a2ffdbaa88";
            const policyId = "4bd15028-40dc-4756-abe5-f3839c6172f7";
            const uri = getProvisioningPolicyUri(TENANT, sourceId, policyId, "Agent Identity Account");

            assert.strictEqual(uri.authority, TENANT);
            assert.strictEqual(getIdByUri(uri), policyId);
            assert.strictEqual(
                getPathByUri(uri),
                `/sources/v2/${sourceId}/provisioning-policies/${policyId}`
            );
        });
    });
});
