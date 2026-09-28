import * as assert from "assert";
import { Index } from "sailpoint-api-client/dist/search/api.js";
import { buildSearchQuery } from "../../utils/buildSearchQuery.js";

suite("buildSearchQuery", () => {
	test("requires at least one index", () => {
		assert.throws(
			() => buildSearchQuery({ query: "*" }),
			/Search query requires at least one index/
		);
	});

	test("wraps a single index and prefers an explicit index list", () => {
		assert.deepStrictEqual(
			buildSearchQuery({ index: Index.Identities, query: "name:ada" }).indices,
			[Index.Identities]
		);
		assert.deepStrictEqual(
			buildSearchQuery({
				index: Index.Identities,
				indices: [Index.Roles, Index.Accessprofiles],
				query: "*",
			}).indices,
			[Index.Roles, Index.Accessprofiles]
		);
	});

	test("splits a comma-separated sort and omits the result filter when no fields are requested", () => {
		const search = buildSearchQuery({
			index: Index.Events,
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
			index: Index.Identities,
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
