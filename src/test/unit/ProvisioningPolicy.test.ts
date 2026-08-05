import * as assert from "assert";
import { describe, it } from "mocha";
import { getProvisioningPoliciesPath } from "../../models/ProvisioningPolicy";

suite("ProvisioningPolicy Test Suite", () => {
    describe("getProvisioningPoliciesPath()", () => {
        it("builds the Sources V2 collection path", () => {
            assert.strictEqual(
                getProvisioningPoliciesPath("source-id"),
                "/sources/v2/source-id/provisioning-policies"
            );
        });

        it("builds the Sources V2 policy path by UUID", () => {
            assert.strictEqual(
                getProvisioningPoliciesPath("source-id", "policy-id"),
                "/sources/v2/source-id/provisioning-policies/policy-id"
            );
        });
    });
});
