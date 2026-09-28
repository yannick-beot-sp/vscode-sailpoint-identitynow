import * as assert from "assert";
import { Index } from "sailpoint-api-client/dist/search/api.js";
import { buildSearchQuery } from "../../utils/buildSearchQuery.js";
import {
	accessItemTypeFromSearchDocument,
	buildRequestableAccessItemQuery,
	REQUESTABLE_ACCESS_INDICES,
	REQUESTABLE_ACCESS_SEARCH_FIELDS,
} from "../../utils/requestableAccessSearch.js";

suite("requestable access search", () => {
	test("quotes the term and filters requestable items", () => {
		assert.strictEqual(
			buildRequestableAccessItemQuery("Helpdesk"),
			'(id:"Helpdesk" OR name:"Helpdesk") AND requestable:true'
		);
	});

	test("escapes quotes and backslashes in the term", () => {
		assert.strictEqual(
			buildRequestableAccessItemQuery('a"b\\c'),
			'(id:"a\\"b\\\\c" OR name:"a\\"b\\\\c") AND requestable:true'
		);
	});

	test("searches roles, access profiles, and entitlements together", () => {
		const search = buildSearchQuery({
			indices: REQUESTABLE_ACCESS_INDICES,
			query: buildRequestableAccessItemQuery("2c91808a"),
			sort: "name",
			fields: REQUESTABLE_ACCESS_SEARCH_FIELDS,
		});

		assert.deepStrictEqual(search.indices, [
			Index.Roles,
			Index.Accessprofiles,
			Index.Entitlements,
		]);
		assert.deepStrictEqual(search.queryResultFilter?.includes, REQUESTABLE_ACCESS_SEARCH_FIELDS);
	});

	test("infers the access item type from search document fields", () => {
		assert.strictEqual(
			accessItemTypeFromSearchDocument({ id: "1", name: "Admin", attribute: "memberOf", source: { name: "AD" } }),
			"ENTITLEMENT"
		);
		assert.strictEqual(
			accessItemTypeFromSearchDocument({ id: "2", name: "Employees", source: { name: "AD" } }),
			"ACCESS_PROFILE"
		);
		assert.strictEqual(
			accessItemTypeFromSearchDocument({ id: "3", name: "Helpdesk" }),
			"ROLE"
		);
	});
});