import "./vscodeStub";
import * as assert from "assert";
import { AdditionalOwnerRefV2025 } from "sailpoint-api-client";
import { CacheService } from "../../services/cache/CacheService";
import { GovernanceGroupIdToNameCacheService } from "../../services/cache/GovernanceGroupIdToNameCacheService";
import { GovernanceGroupNameToIdCacheService } from "../../services/cache/GovernanceGroupNameToIdCacheService";
import { IdentityIdToNameCacheService } from "../../services/cache/IdentityIdToNameCacheService";
import { IdentityUsernameToIdCacheService } from "../../services/cache/IdentityNameToIdCacheService";
import { getAdditionalOwners, resolveAdditionalOwners } from "../../utils/additionalOwners";

function cache(entries: Record<string, string>): CacheService<string> {
	return new CacheService(async (key: string) => {
		const value = entries[key];
		if (value === undefined) {
			throw new Error(`Unknown cache key ${key}`);
		}
		return value;
	});
}

suite("additional owners", () => {
	test("exports a governance group name ahead of identity owners", async () => {
		const exported = await getAdditionalOwners(
			[
				{ type: "IDENTITY", id: "id-1", name: "Ignored Display Name" },
				{ type: "GOVERNANCE_GROUP", id: "gg-1" },
			],
			cache({ "id-1": "ada" }) as IdentityIdToNameCacheService,
			cache({ "gg-1": "Managers" }) as GovernanceGroupIdToNameCacheService
		);

		assert.deepStrictEqual(exported, {
			additionalOwners: null,
			additionalOwnerGovernanceGroup: "Managers",
		});
	});

	test("exports identity usernames from the cache and ignores owners without an id", async () => {
		const exported = await getAdditionalOwners(
			[
				{ type: "IDENTITY", id: "id-1", name: "Ada Lovelace" },
				{ type: "IDENTITY" },
				{ type: "IDENTITY", id: "id-2" },
			] as AdditionalOwnerRefV2025[],
			cache({ "id-1": "ada", "id-2": "grace" }) as IdentityIdToNameCacheService,
			cache({}) as GovernanceGroupIdToNameCacheService
		);

		assert.deepStrictEqual(exported, {
			additionalOwners: "ada;grace",
			additionalOwnerGovernanceGroup: null,
		});
	});

	test("returns empty columns when there is no owner", async () => {
		assert.deepStrictEqual(
			await getAdditionalOwners(undefined, cache({}) as IdentityIdToNameCacheService, cache({}) as GovernanceGroupIdToNameCacheService),
			{ additionalOwners: null, additionalOwnerGovernanceGroup: null }
		);
	});

	test("resolves either identities or one governance group", async () => {
		const identities = await resolveAdditionalOwners(
			" ada ; grace ",
			undefined,
			cache({ ada: "id-1", grace: "id-2" }) as IdentityUsernameToIdCacheService,
			cache({}) as GovernanceGroupNameToIdCacheService
		);
		assert.deepStrictEqual(identities, [
			{ type: "IDENTITY", id: "id-1" },
			{ type: "IDENTITY", id: "id-2" },
		]);

		const group = await resolveAdditionalOwners(
			undefined,
			" Managers ",
			cache({}) as IdentityUsernameToIdCacheService,
			cache({ Managers: "gg-1" }) as GovernanceGroupNameToIdCacheService
		);
		assert.deepStrictEqual(group, [{ type: "GOVERNANCE_GROUP", id: "gg-1", name: "Managers" }]);
		assert.strictEqual(await resolveAdditionalOwners(undefined, undefined, cache({}) as IdentityUsernameToIdCacheService, cache({}) as GovernanceGroupNameToIdCacheService), null);
	});

	test("rejects both owner kinds together and more than ten identities", async () => {
		await assert.rejects(
			() => resolveAdditionalOwners("ada", "Managers", cache({}) as IdentityUsernameToIdCacheService, cache({}) as GovernanceGroupNameToIdCacheService),
			/Both additionalOwners and additionalOwnerGovernanceGroup are set/
		);

		const eleven = Array.from({ length: 11 }, (_, index) => `user${index}`).join(";");
		await assert.rejects(
			() => resolveAdditionalOwners(eleven, undefined, cache({}) as IdentityUsernameToIdCacheService, cache({}) as GovernanceGroupNameToIdCacheService),
			/Too many additional owners\. Maximum is 10 identities\./
		);
	});
});
