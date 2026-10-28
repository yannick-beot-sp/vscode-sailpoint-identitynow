import * as assert from "assert";
import { describe, it } from "mocha";
import { buildSegmentMembershipPatch, buildSegmentPatch } from "../../utils/segmentPatch.js";
import { buildSodPolicyUpdatePayload } from "../../utils/sodPolicyPayload.js";
import { getIdByUri, getPathByUri, getResourceUri, getResourceWebUrl } from "../../utils/UriUtils.js";

const TENANT = "company.identitynow.com";

const segment = {
    id: "2c91808a7813090a017813a0b1c20033",
    name: "Austin",
    created: "2021-03-01T22:32:58.104Z",
    modified: "2021-03-02T20:22:28.104Z",
    description: "Identities located in Austin",
    owner: { type: "IDENTITY", id: "2c9180a46faadee4016fb4e018c20639", name: "Owner" },
    visibilityCriteria: {
        expression: {
            operator: "AND",
            children: [{ operator: "EQUALS", attribute: "location", value: { type: "STRING", value: "Austin" } }],
        },
    },
    active: true,
};

suite("Segments and SoD policies Test Suite", () => {
    describe("segment URIs", () => {
        it("resolves the API path of a segment", () => {
            const uri = getResourceUri(TENANT, "segments", segment.id, segment.name);
            assert.strictEqual(getPathByUri(uri), `/segments/v1/${segment.id}`);
            assert.strictEqual(getIdByUri(uri), segment.id);
        });
        it("builds the Web UI url of a segment", () => {
            const url = getResourceWebUrl("company25714-poc.identitynow-demo.com", "segment", "e303dd2f-f3e2-4c3c-bd0d-aeb914c6b1bc");
            assert.strictEqual(
                url?.toString(),
                "https://company25714-poc.identitynow-demo.com/ui/a/admin/access/segments/manage/e303dd2f-f3e2-4c3c-bd0d-aeb914c6b1bc/name-segment");
        });
        it("builds the Web UI url of a general policy", () => {
            const url = getResourceWebUrl("company25714-poc.identitynow-demo.com", "general-policy", "00c81208-b3f9-4ab7-ae8b-3e3a42317ae7");
            assert.strictEqual(
                url?.toString(),
                "https://company25714-poc.identitynow-demo.com/ui/search/policies/landing/00c81208-b3f9-4ab7-ae8b-3e3a42317ae7/view");
        });
        it("resolves the API path of a SoD policy", () => {
            const uri = getResourceUri(TENANT, "sod-policies", "abc", "No AP and Role");
            assert.strictEqual(getPathByUri(uri), "/sod-policies/v1/abc");
            assert.strictEqual(getIdByUri(uri), "abc");
        });
    });

    describe("buildSegmentPatch", () => {
        it("is empty when nothing changed", () => {
            assert.deepStrictEqual(buildSegmentPatch(segment, JSON.parse(JSON.stringify(segment))), []);
        });

        it("ignores read-only properties", () => {
            const edited = { ...segment, modified: "2030-01-01T00:00:00.000Z", created: "2030-01-01T00:00:00.000Z" };
            assert.deepStrictEqual(buildSegmentPatch(segment, edited), []);
        });

        it("replaces simple properties", () => {
            const edited = { ...segment, name: "Dallas", description: "Dallas", active: false };
            assert.deepStrictEqual(buildSegmentPatch(segment, edited), [
                { op: "replace", path: "/name", value: "Dallas" },
                { op: "replace", path: "/description", value: "Dallas" },
                { op: "replace", path: "/active", value: false },
            ]);
        });

        it("replaces visibilityCriteria as a whole instead of patching nested paths", () => {
            const visibilityCriteria = {
                expression: {
                    operator: "AND",
                    children: [{ operator: "EQUALS", attribute: "location", value: { type: "STRING", value: "Dallas" } }],
                },
            };
            assert.deepStrictEqual(
                buildSegmentPatch(segment, { ...segment, visibilityCriteria }),
                [{ op: "replace", path: "/visibilityCriteria", value: visibilityCriteria }]);
        });

        it("replaces the owner as a whole", () => {
            const owner = { type: "IDENTITY", id: "other", name: "Other" };
            assert.deepStrictEqual(
                buildSegmentPatch(segment, { ...segment, owner }),
                [{ op: "replace", path: "/owner", value: owner }]);
        });

        it("adds a property that did not exist", () => {
            const { description, ...withoutDescription } = segment;
            assert.deepStrictEqual(
                buildSegmentPatch(withoutDescription, segment),
                [{ op: "add", path: "/description", value: segment.description }]);
        });

        it("does not remove a property missing from the edited document", () => {
            const { description, ...edited } = segment;
            assert.deepStrictEqual(buildSegmentPatch(segment, edited), []);
        });
    });

    describe("buildSegmentMembershipPatch", () => {
        const SEGMENT = "seg1";

        it("adds the segment to an object that has none (property absent or null)", () => {
            const expected = [{ op: "add", path: "/segments", value: [SEGMENT] }];
            assert.deepStrictEqual(buildSegmentMembershipPatch(undefined, SEGMENT, "add"), expected);
            assert.deepStrictEqual(buildSegmentMembershipPatch(null, SEGMENT, "add"), expected);
        });

        it("appends the segment to the existing ones", () => {
            assert.deepStrictEqual(
                buildSegmentMembershipPatch(["other"], SEGMENT, "add"),
                [{ op: "replace", path: "/segments", value: ["other", SEGMENT] }]);
        });

        it("does nothing when the object is already in the segment", () => {
            assert.deepStrictEqual(buildSegmentMembershipPatch([SEGMENT], SEGMENT, "add"), []);
        });

        it("removes only the segment", () => {
            assert.deepStrictEqual(
                buildSegmentMembershipPatch(["other", SEGMENT], SEGMENT, "remove"),
                [{ op: "replace", path: "/segments", value: ["other"] }]);
        });

        it("sends an empty array when the last segment is removed", () => {
            assert.deepStrictEqual(
                buildSegmentMembershipPatch([SEGMENT], SEGMENT, "remove"),
                [{ op: "replace", path: "/segments", value: [] }]);
        });

        it("does nothing when removing from a segment the object is not in", () => {
            assert.deepStrictEqual(buildSegmentMembershipPatch(["other"], SEGMENT, "remove"), []);
            assert.deepStrictEqual(buildSegmentMembershipPatch(null, SEGMENT, "remove"), []);
        });

        it("does not mutate its input", () => {
            const segments = ["other"];
            buildSegmentMembershipPatch(segments, SEGMENT, "add");
            assert.deepStrictEqual(segments, ["other"]);
        });
    });

    describe("buildSodPolicyUpdatePayload", () => {
        it("removes read-only properties and keeps the others", () => {
            const policy = {
                id: "abc",
                name: "Policy",
                created: "2021-03-01T22:32:58.104Z",
                modified: "2021-03-02T20:22:28.104Z",
                creatorId: "creator",
                modifierId: "modifier",
                scheduled: false,
                state: "ENFORCED",
                type: "GENERAL",
                policyQuery: "@access(name:x)",
            };
            assert.deepStrictEqual(buildSodPolicyUpdatePayload(policy), {
                id: "abc",
                name: "Policy",
                state: "ENFORCED",
                type: "GENERAL",
                policyQuery: "@access(name:x)",
            });
        });

        it("does not mutate its input", () => {
            const policy = { name: "Policy", created: "now" };
            buildSodPolicyUpdatePayload(policy);
            assert.strictEqual(policy.created, "now");
        });
    });
});
