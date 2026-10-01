/**
 * EntitlementExport.test.ts
 *
 * Integration tests for the entitlements column of the access profile and role CSV exports
 * (cf. issue #175: the column was blank after upgrading to 1.3.32).
 *
 * Both exports run against the tenant from .env. The expected cell of every access profile
 * and role is rebuilt from the /v2025 endpoints used by 1.3.30, independently of the
 * converters and caches used by the exporters.
 *
 * Prerequisites
 * -------------
 * Copy .env.example → .env and fill in real ISC credentials.
 * Run:  npm run test:integration
 */

import * as assert from "assert";
import * as os from "os";
import * as path from "path";
import { mkdtemp, rm } from "node:fs/promises";

import { AccessProfileExporterCommand } from "../../../commands/access-profile/ExportAccessProfiles.js";
import { RoleExporterCommand } from "../../../commands/role/ExportRoles.js";
import { CSVReader } from "../../../services/CSVReader.js";
import { ISCClient } from "../../../services/ISCClient.js";
import { SailPointISCAuthenticationProvider } from "../../../services/AuthenticationProvider.js";
import { createMockTenantService, TENANT_INFO } from "../mcpTestFixture.js";

const PAGE_SIZE = 250;
const CONCURRENCY = 10;

interface Ref {
    id: string;
    name?: string;
}

interface AccessItem {
    id: string;
    name: string;
    entitlements?: Ref[] | Ref | null;
}

interface RawEntitlement {
    id: string;
    name: string;
    attribute: string;
    source?: { id?: string; name?: string };
}

interface CsvRow {
    [column: string]: string;
}

function refsOf(item: AccessItem): Ref[] {
    const refs = item.entitlements;
    if (refs === undefined || refs === null) {
        return [];
    }
    return Array.isArray(refs) ? refs : [refs];
}

async function readCsv(filePath: string): Promise<CsvRow[]> {
    const reader = new CSVReader<CsvRow>(filePath);
    const rows: CsvRow[] = [];
    await reader.processLine((line) => {
        rows.push(line);
    });
    return rows;
}

describe("Entitlements column of the CSV exports – integration tests", function () {
    jest.setTimeout(20 * 60 * 1000);

    let tempDir: string;
    let accessProfilePath: string;
    let rolePath: string;
    let client: ISCClient;
    const node = {
        tenantId: TENANT_INFO.id,
        tenantName: TENANT_INFO.tenantName,
        tenantDisplayName: TENANT_INFO.name,
    };

    const exportErrors: string[] = [];
    const entitlements = new Map<string, Promise<RawEntitlement>>();
    let originalWarn: typeof console.warn;
    let originalError: typeof console.error;

    async function listAll(resourcePath: string): Promise<AccessItem[]> {
        const items: AccessItem[] = [];
        for (let offset = 0; ; offset += PAGE_SIZE) {
            const page: AccessItem[] = await client.getResource(
                `${resourcePath}?limit=${PAGE_SIZE}&offset=${offset}&sorters=name`
            );
            items.push(...page);
            if (page.length < PAGE_SIZE) {
                return items;
            }
        }
    }

    function getEntitlement(id: string): Promise<RawEntitlement> {
        let entitlement = entitlements.get(id);
        if (entitlement === undefined) {
            entitlement = client.getResource(`/v2025/entitlements/${encodeURIComponent(id)}`);
            entitlements.set(id, entitlement);
        }
        return entitlement;
    }

    async function expectedCells(
        items: AccessItem[],
        format: (entitlement: RawEntitlement) => string
    ): Promise<Map<string, string>> {
        const expected = new Map<string, string>();
        const withEntitlements = items.filter((item) => refsOf(item).length > 0);
        for (let i = 0; i < withEntitlements.length; i += CONCURRENCY) {
            await Promise.all(withEntitlements.slice(i, i + CONCURRENCY).map(async (item) => {
                const values = await Promise.all(refsOf(item).map(async (ref) => format(await getEntitlement(ref.id))));
                expected.set(item.name, values.join(";"));
            }));
        }
        return expected;
    }

    function assertEntitlementsColumn(kind: string, rows: CsvRow[], expected: Map<string, string>): void {
        assert.ok(expected.size > 0, `tenant should have at least one ${kind} with entitlements`);

        const rowsByName = new Map(rows.map((row) => [row.name, row]));
        const mismatches: string[] = [];
        for (const [name, cell] of expected) {
            const actual = rowsByName.get(name)?.entitlements ?? "";
            if (actual !== cell) {
                mismatches.push(`${kind} "${name}": expected "${cell}", got "${actual}"`);
            }
        }
        const unexpected = rows
            .filter((row) => !expected.has(row.name) && (row.entitlements ?? "") !== "")
            .map((row) => `${kind} "${row.name}": unexpected entitlements "${row.entitlements}"`);

        const problems = [...mismatches, ...unexpected];
        assert.deepStrictEqual(
            problems,
            [],
            `${problems.length} ${kind} row(s) with a wrong entitlements column:\n${problems.slice(0, 20).join("\n")}`
        );

        const exported = rows.filter((row) => (row.entitlements ?? "") !== "").length;
        assert.strictEqual(exported, expected.size, `every ${kind} with entitlements should have a non-empty column`);
    }

    beforeAll(async function () {
        SailPointISCAuthenticationProvider.initialize(createMockTenantService() as never);
        client = new ISCClient(node.tenantId, node.tenantName);

        tempDir = await mkdtemp(path.join(os.tmpdir(), "idn-entitlement-export-"));
        accessProfilePath = path.join(tempDir, "access-profiles.csv");
        rolePath = path.join(tempDir, "roles.csv");

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
        vscode.window.showErrorMessage = async (message: string) => {
            exportErrors.push(`showErrorMessage: ${message}`);
            return undefined;
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

        // The exporters catch conversion failures, log them, and leave the cell blank.
        // Retried network errors on unrelated lookups (owners, …) are not export failures.
        const capture = (level: string, args: unknown[]) => {
            const message = args.map(String).join(" ");
            if (/entitlement/i.test(message)) {
                exportErrors.push(`console.${level}: ${message}`);
            }
        };
        originalWarn = console.warn;
        originalError = console.error;
        console.warn = (...args: unknown[]) => {
            capture("warn", args);
            originalWarn(...args);
        };
        console.error = (...args: unknown[]) => {
            capture("error", args);
            originalError(...args);
        };
    });

    beforeEach(function () {
        exportErrors.length = 0;
    });

    afterAll(async function () {
        console.warn = originalWarn;
        console.error = originalError;
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it("exports the entitlements of every access profile without error", async function () {
        await new AccessProfileExporterCommand().execute(node as never);
        assert.deepStrictEqual(exportErrors, [], `access profile export reported errors:\n${exportErrors.join("\n")}`);

        const rows = await readCsv(accessProfilePath);
        const accessProfiles = await listAll("/v2025/access-profiles");
        assert.strictEqual(rows.length, accessProfiles.length, "CSV should contain every access profile");

        const expected = await expectedCells(accessProfiles, (entitlement) => `${entitlement.attribute}|${entitlement.name}`);
        assertEntitlementsColumn("access profile", rows, expected);
    });

    it("exports the entitlements of every role without error", async function () {
        await new RoleExporterCommand().execute(node as never);
        assert.deepStrictEqual(exportErrors, [], `role export reported errors:\n${exportErrors.join("\n")}`);

        const rows = await readCsv(rolePath);
        const roles = await listAll("/v2025/roles");
        assert.strictEqual(rows.length, roles.length, "CSV should contain every role");

        const expected = await expectedCells(
            roles,
            (entitlement) => `${entitlement.source?.name}|${entitlement.attribute}|${entitlement.name}`
        );
        assertEntitlementsColumn("role", rows, expected);
    });
});
