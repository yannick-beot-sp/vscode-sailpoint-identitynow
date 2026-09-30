/**
 * Functional tests for the ISCClient methods that still called legacy HTTP paths.
 * They run against the tenant in .env.
 *
 * Run: npm run test:integration -- --runTestsByPath ./src/test/mcp/apps/SourceAppClient.test.ts
 * or:  npx jest --runInBand --config jest.mcp.config.cjs --runTestsByPath ./src/test/mcp/apps/SourceAppClient.test.ts
 */

import * as assert from "assert";
import { Campaign2StatusEnum } from "sailpoint-api-client/dist/certification_campaigns/api.js";
import { ISCClient, TOTAL_COUNT_HEADER } from "../../../services/ISCClient.js";
import { SailPointISCAuthenticationProvider } from "../../../services/AuthenticationProvider.js";
import { createMockTenantService, TENANT_INFO } from "../mcpTestFixture.js";

function headerValue(headers: { get?: (name: string) => unknown } & Record<string, unknown>, name: string): unknown {
    if (typeof headers.get === "function") {
        return headers.get(name);
    }
    return headers[name];
}

describe("ISCClient legacy HTTP methods – functional", function () {
    jest.setTimeout(120_000);

    let client: ISCClient;
    let createdAppId: string | undefined;

    beforeAll(function () {
        SailPointISCAuthenticationProvider.initialize(createMockTenantService() as never);
        client = new ISCClient(TENANT_INFO.id, TENANT_INFO.tenantName);
    });

    afterAll(async function () {
        if (!createdAppId) {
            return;
        }
        await client.deleteResource(`/source-apps/v1/${createdAppId}`);
    });

    it("creates a source app, attaches one access profile, then removes it", async function () {
        const listed = await client.getAccessProfiles({ limit: 1, offset: 0 });
        const accessProfile = listed.data[0];
        assert.ok(accessProfile?.id, "the tenant should have at least one access profile");
        assert.ok(accessProfile.source?.id, "the access profile should reference a source");

        const name = `vscode-idn-test-${Date.now()}`;
        const created = await client.createApplication({
            name,
            description: "Temporary application created by the extension functional test",
            sourceId: accessProfile.source.id,
        });
        createdAppId = created.id;
        assert.ok(createdAppId, "createApplication should return an id");
        assert.strictEqual(created.name, name);

        const loaded = await client.getApplication(createdAppId);
        assert.strictEqual(loaded?.id, createdAppId);
        assert.strictEqual(loaded?.name, name);

        const before = await client.getPaginatedApplicationAccessProfiles(createdAppId, 50, 0);
        assert.ok(Array.isArray(before.data));
        assert.ok(
            !before.data.some((item) => item.id === accessProfile.id),
            "a new source app should not already contain the access profile"
        );

        await client.addAccessProfilesToApplication(createdAppId, [accessProfile.id]);

        const afterAdd = await client.getPaginatedApplicationAccessProfiles(createdAppId, 50, 0);
        assert.ok(
            afterAdd.data.some((item) => item.id === accessProfile.id && item.name === accessProfile.name),
            "the access profile should be listed on the source app"
        );

        await client.removeAccessProfileFromApplication(createdAppId, accessProfile.id);

        const afterRemove = await client.getPaginatedApplicationAccessProfiles(createdAppId, 50, 0);
        assert.ok(
            !afterRemove.data.some((item) => item.id === accessProfile.id),
            "the access profile should be gone after bulk remove"
        );
    });

    it("lists campaigns with the same filter the tree view sends", async function () {
        const filters = `status in ("${Object.values(Campaign2StatusEnum).join('","')}")`;
        const response = await client.getPaginatedCampaigns(filters, 1, 0, true);

        assert.ok(Array.isArray(response.data));
        assert.ok(response.data.length <= 1);
        const total = Number(headerValue(response.headers as { get?: (name: string) => unknown } & Record<string, unknown>, TOTAL_COUNT_HEADER));
        assert.ok(Number.isFinite(total) && total >= response.data.length);

        const campaign = response.data[0];
        if (campaign) {
            assert.ok(campaign.id);
            assert.ok(campaign.name);
            assert.ok(campaign.status);
        }
    });

    it("reads the email test mode", async function () {
        const mode = await client.getEmailTestMode();
        assert.strictEqual(typeof mode.emailTestMode, "boolean");
    });
});
