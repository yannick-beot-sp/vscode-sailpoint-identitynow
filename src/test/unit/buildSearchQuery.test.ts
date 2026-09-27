import * as assert from "assert";
import { IndexV2025 } from "sailpoint-api-client";
import { buildSearchQuery } from "../../utils/buildSearchQueryV2025";

suite("buildSearchQuery", () => {
	test("requires at least one index", () => {
		assert.throws(
			() => buildSearchQuery({ query: "*" }),
			/Search query requires at least one index/
		);
	});

	test("wraps a single index and prefers an explicit index list", () => {
		assert.deepStrictEqual(
			buildSearchQuery({ index: IndexV2025.Identities, query: "name:ada" }).indices,
			[IndexV2025.Identities]
		);
		assert.deepStrictEqual(
			buildSearchQuery({
				index: IndexV2025.Identities,
				indices: [IndexV2025.Roles, IndexV2025.Accessprofiles],
				query: "*",
			}).indices,
			[IndexV2025.Roles, IndexV2025.Accessprofiles]
		);
	});

	test("splits a comma-separated sort and omits the result filter when no fields are requested", () => {
		const search = buildSearchQuery({
			index: IndexV2025.Events,
			query: "*",
			sort: "name, -created",
		});

		assert.deepStrictEqual(search.sort, ["name", "-created"]);
		assert.strictEqual(search.includeNested, false);
		assert.strictEqual(search.queryResultFilter, undefined);
		assert.deepStrictEqual(search.query, { query: "*" });
	});

	test("keeps an array sort and requests nested documents and fields", () => {
		const search = buildSearchQuery({
			index: IndexV2025.Identities,
			query: "id:1",
			sort: ["displayName"],
			fields: ["id", "name"],
			includeNested: true,
		});

		assert.deepStrictEqual(search.sort, ["displayName"]);
		assert.strictEqual(search.includeNested, true);
		assert.deepStrictEqual(search.queryResultFilter, { includes: ["id", "name"] });
	});
});
