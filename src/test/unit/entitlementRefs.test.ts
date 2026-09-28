import "./vscodeStub.js";
import * as assert from "assert";
import { CacheService } from "../../services/cache/CacheService.js";
import { EntitlementCacheService } from "../../services/cache/EntitlementCacheService.js";
import { SourceNameToIdCacheService } from "../../services/cache/SourceNameToIdCacheService.js";
import { entitlementToStringConverter, stringToEntitlementConverter } from "../../utils/entitlementUtils.js";

function cache(entries: Record<string, string>): CacheService<string> {
	return new CacheService(async (key: string) => {
		const value = entries[key];
		if (value === undefined) {
			throw new Error(`Unknown cache key ${key}`);
		}
		return value;
	});
}

suite("entitlement references", () => {
	test("exports entitlement names joined for CSV", async () => {
		assert.strictEqual(await entitlementToStringConverter(undefined, cache({})), undefined);
		assert.strictEqual(await entitlementToStringConverter([], cache({})), undefined);
		assert.strictEqual(
			await entitlementToStringConverter(
				[{ id: "ent-1", name: "ignored" }, { id: "ent-2" }],
				cache({ "ent-1": "AD|memberOf|Domain Users", "ent-2": "AD|Domain Admins" })
			),
			"AD|memberOf|Domain Users;AD|Domain Admins"
		);
	});

	test("imports the attribute form and the legacy source|name form", async () => {
		const refs = await stringToEntitlementConverter(
			"AD|memberOf|Domain Users;AD|Domain Admins",
			cache({ AD: "source-1" }) as SourceNameToIdCacheService,
			cache({
				"source-1|memberOf|Domain Users": "ent-1",
				"source-1|Domain Admins": "ent-2",
			}) as EntitlementCacheService
		);

		assert.deepStrictEqual(refs, [
			{ name: "Domain Users", id: "ent-1", type: "ENTITLEMENT" },
			{ name: "Domain Admins", id: "ent-2", type: "ENTITLEMENT" },
		]);
	});

	test("returns no reference for a blank value and rejects an unknown format", async () => {
		assert.deepStrictEqual(
			await stringToEntitlementConverter("  ", cache({}) as SourceNameToIdCacheService, cache({}) as EntitlementCacheService),
			[]
		);
		await assert.rejects(
			() => stringToEntitlementConverter("only-a-name", cache({}) as SourceNameToIdCacheService, cache({}) as EntitlementCacheService),
			/Invalid entitlement format: only-a-name/
		);
	});
});
