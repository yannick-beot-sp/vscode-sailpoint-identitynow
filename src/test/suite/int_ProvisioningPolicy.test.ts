import * as assert from "assert";
import { describe, it } from "mocha";
import { ProvisioningPolicyTreeItem } from "../../models/ISCTreeItem";
import { ISCClient } from "../../services/ISCClient";
import { getDependencyNodeUri } from "../../dependency-webview/DependencyNodeResource";
import { getIdByUri, getPathByUri, getProvisioningPolicyUri } from "../../utils/UriUtils";
import type { CreateProvisioningPolicyV2, ProvisioningPolicyV2 } from "../../models/ProvisioningPolicy";

suite("Provisioning Policy V2 Test Suite", () => {
    const sourceId = "4aa7b635a5da4f58bfa688a2ffdbaa88";
    const firstPolicyId = "4bd15028-40dc-4756-abe5-f3839c6172f7";
    const secondPolicyId = "cd9a38ca-aa55-4bea-a0c7-f128559c78b7";

    describe("UUID-based resource URIs", () => {
        it("builds and parses a Sources V2 provisioning-policy URI", () => {
            const uri = getProvisioningPolicyUri(
                "example.identitynow.com",
                sourceId,
                firstPolicyId,
                "Agent Identity Account"
            );

            assert.strictEqual(
                uri.path,
                `/sources/v2/${sourceId}/provisioning-policies/${firstPolicyId}/Agent Identity Account`
            );
            assert.strictEqual(getIdByUri(uri), firstPolicyId);
            assert.strictEqual(
                getPathByUri(uri),
                `/sources/v2/${sourceId}/provisioning-policies/${firstPolicyId}`
            );
        });

        it("keeps slashes in labels out of the API path hierarchy", () => {
            const uri = getProvisioningPolicyUri(
                "example.identitynow.com",
                sourceId,
                firstPolicyId,
                "Agent / Identity Account"
            );

            assert.strictEqual(
                uri.path,
                `/sources/v2/${sourceId}/provisioning-policies/${firstPolicyId}/Agent %2F Identity Account`
            );
            assert.strictEqual(getIdByUri(uri), firstPolicyId);
        });
    });

    describe("ProvisioningPolicyTreeItem", () => {
        it("uses policy UUIDs to distinguish duplicate machine-account usage types", () => {
            const first = new ProvisioningPolicyTreeItem({
                tenantId: "tenant-id",
                tenantName: "example.identitynow.com",
                tenantDisplayName: "Example",
                sourceId,
                policyId: firstPolicyId,
                usageType: "CREATE_MACHINE_ACCOUNT",
                name: "Agent Identity Account"
            });
            const second = new ProvisioningPolicyTreeItem({
                tenantId: "tenant-id",
                tenantName: "example.identitynow.com",
                tenantDisplayName: "Example",
                sourceId,
                policyId: secondPolicyId,
                usageType: "CREATE_MACHINE_ACCOUNT",
                name: "Service Identity Account"
            });

            assert.notStrictEqual(first.id, second.id);
            assert.notStrictEqual(first.uri.path, second.uri.path);
            assert.strictEqual(first.resourceId, firstPolicyId);
            assert.strictEqual(second.resourceId, secondPolicyId);
        });
    });

    describe("ISCClient provisioning-policy delegation", () => {
        it("lists policies from the Sources V2 collection", async () => {
            const expected: ProvisioningPolicyV2[] = [{
                id: firstPolicyId,
                name: "Agent Identity Account",
                usageType: "CREATE_MACHINE_ACCOUNT",
                subtypeId: "subtype-id",
                fields: []
            }];
            const client = new ISCClient("tenant-id", "example.identitynow.com");
            let requestedPath: string | undefined;
            client.getResource = async path => {
                requestedPath = path;
                return expected;
            };

            const result = await client.getProvisioningPolicies(sourceId);

            assert.strictEqual(requestedPath, `/sources/v2/${sourceId}/provisioning-policies`);
            assert.deepStrictEqual(result, expected);
        });

        it("creates policies in Sources V2 and preserves the returned UUID", async () => {
            const request: CreateProvisioningPolicyV2 = {
                name: "Create",
                usageType: "CREATE",
                fields: []
            };
            const created: ProvisioningPolicyV2 = { id: firstPolicyId, ...request };
            const client = new ISCClient("tenant-id", "example.identitynow.com");
            let requestedPath: string | undefined;
            let requestedData: string | object | undefined;
            client.createResource = async (path, data) => {
                requestedPath = path;
                requestedData = data;
                return created;
            };

            const result = await client.createProvisioningPolicy(sourceId, request);

            assert.strictEqual(requestedPath, `/sources/v2/${sourceId}/provisioning-policies`);
            assert.strictEqual(requestedData, request);
            assert.strictEqual(result.id, firstPolicyId);
        });
    });

    describe("dependency graph resource URIs", () => {
        it("opens a provisioning-policy node by its real UUID", () => {
            const uri = getDependencyNodeUri(
                "example.identitynow.com",
                {
                    id: `${sourceId}::${firstPolicyId}`,
                    type: "provisioning-policy",
                    label: "CREATE_MACHINE_ACCOUNT",
                    resourceId: firstPolicyId,
                    attributes: { usageType: "CREATE_MACHINE_ACCOUNT" }
                },
                sourceId
            );

            assert.strictEqual(
                uri?.path,
                `/sources/v2/${sourceId}/provisioning-policies/${firstPolicyId}/CREATE_MACHINE_ACCOUNT`
            );
        });
    });
});
