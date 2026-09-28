import * as assert from "assert";
import {
	buildIdentityEventsSearchQuery,
	collectIdentityEventSearchTerms,
	quoteLuceneTerm,
} from "../../utils/identityEventsQuery.js";

suite("identity event search", () => {
	test("quotes lucene terms and escapes quotes and backslashes", () => {
		assert.strictEqual(quoteLuceneTerm('a"b\\c'), '"a\\"b\\\\c"');
	});

	test("matches actor, target, and identity attributes for each term", () => {
		assert.strictEqual(
			buildIdentityEventsSearchQuery(["ada", ""]),
			'(actor.name:"ada" OR target.name:"ada" OR attributes.identityId:"ada" OR attributes.targetIdentityId:"ada")'
		);
	});

	test("searches everything when no term is usable", () => {
		assert.strictEqual(buildIdentityEventsSearchQuery(["", ""]), "*");
	});

	test("collects the identity id, name, and profile aliases once", () => {
		assert.deepStrictEqual(
			collectIdentityEventSearchTerms("id-1", "ada", {
				name: "ada",
				displayName: "Ada Lovelace",
				email: "ada@example.com",
				alias: "",
			}),
			["id-1", "ada", "Ada Lovelace", "ada@example.com"]
		);
	});
});
