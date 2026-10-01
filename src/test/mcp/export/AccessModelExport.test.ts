/**
 * AccessModelExport.test.ts
 *
 * Integration tests for the access profile and role CSV exports.
 * Both commands run against the tenant from .env and write their CSV
 * into a temporary directory.
 *
 * Prerequisites
 * -------------
 * Copy .env.example → .env and fill in real ISC credentials.
 * Run:  npm run test:integration
 */

import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { mkdtemp, rm } from "node:fs/promises";

import { AccessProfileExporterCommand } from "../../../commands/access-profile/ExportAccessProfiles.js";
import { RoleExporterCommand } from "../../../commands/role/ExportRoles.js";
import { EntitlementCacheService, KEY_SEPARATOR } from "../../../services/cache/EntitlementCacheService.js";
import { EntitlementIdToAttributeNameCacheService, EntitlementIdToSourceNameCacheService } from "../../../services/cache/EntitlementIdToSourceNameCacheService.js";
import { SourceNameToIdCacheService } from "../../../services/cache/SourceNameToIdCacheService.js";
import { CSVReader } from "../../../services/CSVReader.js";
import { ISCClient, TOTAL_COUNT_HEADER } from "../../../services/ISCClient.js";
import { SailPointISCAuthenticationProvider } from "../../../services/AuthenticationProvider.js";
import { CSV_MULTIVALUE_SEPARATOR } from "../../../constants.js";
import { entitlementToStringConverter, stringToEntitlementConverter } from "../../../utils/entitlementUtils.js";
import { createMockTenantService, TENANT_INFO } from "../mcpTestFixture.js";

const ACCESS_PROFILE_HEADERS = [
    "name",
    "description",
    "enabled",
    "requestable",
    "source",
    "owner",
    "additionalOwners",
    "additionalOwnerGovernanceGroup",
    "commentsRequired",
    "denialCommentsRequired",
    "approvalSchemes",
    "reauthorizationRequired",
    "requireEndDate",
    "maxPermittedAccessDurationValue",
    "maxPermittedAccessDurationTimeUnit",
    "revokeApprovalSchemes",
    "entitlements",
    "metadata",
];

const ROLE_HEADERS = [
    "name",
    "description",
    "enabled",
    "requestable",
    "owner",
    "additionalOwners",
    "additionalOwnerGovernanceGroup",
    "commentsRequired",
    "denialCommentsRequired",
    "approvalSchemes",
    "reauthorizationRequired",
    "requireEndDate",
    "maxPermittedAccessDurationValue",
    "maxPermittedAccessDurationTimeUnit",
    "revokeApprovalSchemes",
    "accessProfiles",
    "entitlements",
    "membershipCriteria",
    "dimensional",
    "dimensionAttributes",
    "metadata",
];

interface ExportNode {
    tenantId: string;
    tenantName: string;
    tenantDisplayName: string;
}

interface CsvRow {
    [column: string]: string;
}

function totalCountOf(headers: { get?: (name: string) => unknown } & Record<string, unknown>): number {
    const raw = typeof headers.get === "function"
        ? headers.get(TOTAL_COUNT_HEADER)
        : headers[TOTAL_COUNT_HEADER];
    const total = Number(raw);
    assert.ok(Number.isFinite(total), `response should include ${TOTAL_COUNT_HEADER}`);
    return total;
}

function expectedBoolean(value: boolean | undefined): string {
    return value === undefined ? "" : String(value);
}

async function readCsv(filePath: string): Promise<{ headers: string[]; rows: CsvRow[] }> {
    const reader = new CSVReader<CsvRow>(filePath);
    const headers = await reader.getHeaders();
    const rows: CsvRow[] = [];
    await reader.processLine((line) => {
        rows.push(line);
    });
    return { headers, rows };
}

function assertFileInDirectory(filePath: string, directory: string): void {
    assert.ok(fs.existsSync(filePath), `export file should exist: ${filePath}`);
    const relative = path.relative(directory, filePath);
    assert.ok(
        relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative),
        `export file should be stored in ${directory}`
    );
}

describe("Access model CSV export – integration tests", function () {
    jest.setTimeout(15 * 60 * 1000);

    let tempDir: string;
    let accessProfilePath: string;
    let rolePath: string;
    let client: ISCClient;
    const node: ExportNode = {
        tenantId: TENANT_INFO.id,
        tenantName: TENANT_INFO.tenantName,
        tenantDisplayName: TENANT_INFO.name,
    };

    beforeAll(async function () {
        SailPointISCAuthenticationProvider.initialize(createMockTenantService() as never);
        client = new ISCClient(node.tenantId, node.tenantName);

        tempDir = await mkdtemp(path.join(os.tmpdir(), "idn-export-"));
        accessProfilePath = path.join(tempDir, "access-profiles.csv");
        rolePath = path.join(tempDir, "roles.csv");
        console.log("Export directory:", tempDir);

        const vscode = require("vscode") as typeof import("vscode");
        vscode.window.showInputBox = async (options) => {
            const prompt = options?.prompt ?? "";
            if (prompt.includes("access profile")) {
                return accessProfilePath;
            }
            if (prompt.includes("role")) {
                return rolePath;
            }
            return options?.value;
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration.bind(vscode.workspace);
        vscode.workspace.getConfiguration = ((section?: string) => {
            const config = originalGetConfiguration(section);
            return {
                ...config,
                get: (key: string, defaultValue?: unknown) => {
                    const value = config.get(key, defaultValue);
                    if (value !== undefined && value !== null && value !== "") {
                        return value;
                    }
                    return defaultValue ?? "export.csv";
                },
            };
        }) as typeof vscode.workspace.getConfiguration;
    });

    afterAll(async function () {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it("exports every access profile to a CSV in the temporary directory", async function () {
        await new AccessProfileExporterCommand().execute(node as never);

        assertFileInDirectory(accessProfilePath, tempDir);
        const { headers, rows } = await readCsv(accessProfilePath);
        assert.deepStrictEqual(headers, ACCESS_PROFILE_HEADERS);

        const listed = await client.getAccessProfiles({ limit: 1, count: true, offset: 0 });
        const total = totalCountOf(listed.headers as { get?: (name: string) => unknown } & Record<string, unknown>);
        assert.strictEqual(rows.length, total, `CSV should contain all ${total} access profiles`);
        assert.ok(rows.every((row) => row.name.length > 0), "every access profile row should have a name");

        const sample = listed.data[0];
        if (sample === undefined) {
            return;
        }

        const row = rows.find((candidate) => candidate.name === sample.name);
        assert.ok(row, `CSV should contain access profile "${sample.name}"`);
        assert.strictEqual(row.source, sample.source.name);
        assert.strictEqual(row.description ?? "", sample.description ?? "");
        assert.strictEqual(row.enabled, expectedBoolean(sample.enabled));
        assert.strictEqual(row.requestable, expectedBoolean(sample.requestable));

        if (sample.owner?.id) {
            try {
                const identity = await client.getPublicIdentityById(sample.owner.id);
                assert.strictEqual(row.owner, identity.alias ?? "");
            } catch {
                assert.strictEqual(row.owner ?? "", "");
            }
        } else {
            assert.strictEqual(row.owner ?? "", "");
        }
    });

    it("exports access profile entitlements and resolves them on import", async function () {
        const { rows } = await readCsv(accessProfilePath);
        const listed = await client.getAccessProfiles({ limit: 250, offset: 0, count: false });
        const withEntitlements = listed.data.filter((profile) => (profile.entitlements?.length ?? 0) > 0);
        assert.ok(withEntitlements.length > 0, "tenant should have an access profile with entitlements");

        const attributeCache = new EntitlementIdToAttributeNameCacheService(client);
        const sourceCache = new SourceNameToIdCacheService(client);
        const entitlementCache = new EntitlementCacheService(client);
        for (const profile of withEntitlements) {
            const row = rows.find((candidate) => candidate.name === profile.name);
            assert.ok(row, `CSV should contain access profile "${profile.name}"`);
            const expected = await entitlementToStringConverter(profile.entitlements, attributeCache);
            assert.ok(expected, `access profile "${profile.name}" should export its entitlements`);
            assert.strictEqual(row.entitlements, expected);

            const sourceId = await sourceCache.get(row.source);
            const resolvedIds = await Promise.all(expected.split(CSV_MULTIVALUE_SEPARATOR).map(async (entitlementStr) => {
                const [attribute, name] = entitlementStr.split(KEY_SEPARATOR);
                return entitlementCache.get([sourceId, attribute, name].join(KEY_SEPARATOR));
            }));
            assert.deepStrictEqual(
                resolvedIds,
                profile.entitlements!.map((entitlement) => entitlement.id)
            );
        }
    });

    it("exports every role to a CSV in the temporary directory", async function () {
        await new RoleExporterCommand().execute(node as never);

        assertFileInDirectory(rolePath, tempDir);
        const { headers, rows } = await readCsv(rolePath);
        assert.deepStrictEqual(headers, ROLE_HEADERS);

        const listed = await client.getRoles({ limit: 1, count: true, offset: 0 });
        const total = totalCountOf(listed.headers as { get?: (name: string) => unknown } & Record<string, unknown>);
        assert.strictEqual(rows.length, total, `CSV should contain all ${total} roles`);
        assert.ok(rows.every((row) => row.name.length > 0), "every role row should have a name");

        const sample = listed.data[0];
        if (sample === undefined) {
            return;
        }

        const row = rows.find((candidate) => candidate.name === sample.name);
        assert.ok(row, `CSV should contain role "${sample.name}"`);
        assert.strictEqual(row.description ?? "", sample.description ?? "");
        assert.strictEqual(row.enabled, expectedBoolean(sample.enabled));
        assert.strictEqual(row.requestable, expectedBoolean(sample.requestable));
        assert.strictEqual(
            row.accessProfiles ?? "",
            (sample.accessProfiles ?? []).map((accessProfile) => accessProfile.name).join(";")
        );
        assert.strictEqual(
            row.dimensional ?? "",
            sample.dimensional === undefined || sample.dimensional === null ? "" : String(sample.dimensional)
        );
    });

    it("exports role entitlements and resolves them on import", async function () {
        const { rows } = await readCsv(rolePath);
        const listed = await client.getRoles({ limit: 250, offset: 0, count: false });
        const withEntitlements = listed.data.filter((role) => (role.entitlements?.length ?? 0) > 0);
        assert.ok(withEntitlements.length > 0, "tenant should have a role with entitlements");

        const sourceNameCache = new EntitlementIdToSourceNameCacheService(client);
        const sourceCache = new SourceNameToIdCacheService(client);
        const entitlementCache = new EntitlementCacheService(client);
        for (const role of withEntitlements) {
            const row = rows.find((candidate) => candidate.name === role.name);
            assert.ok(row, `CSV should contain role "${role.name}"`);
            const expected = await entitlementToStringConverter(role.entitlements, sourceNameCache);
            assert.ok(expected, `role "${role.name}" should export its entitlements`);
            assert.strictEqual(row.entitlements, expected);

            const resolved = await stringToEntitlementConverter(expected, sourceCache, entitlementCache);
            assert.deepStrictEqual(
                resolved.map((entitlement) => entitlement.id),
                role.entitlements!.map((entitlement) => entitlement.id)
            );
        }
    });
});
