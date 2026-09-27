import * as assert from "assert";
import { CacheService } from "../../services/cache/CacheService";
import {
	approvalSchemeToStringConverter,
	stringToAccessProfileApprovalSchemeConverter,
	stringToRoleApprovalSchemeConverter,
} from "../../utils/approvalSchemeConverter";

function cache(entries: Record<string, string>): CacheService<string> {
	return new CacheService(async (key: string) => {
		const value = entries[key];
		if (value === undefined) {
			throw new Error(`Unknown cache key ${key}`);
		}
		return value;
	});
}

suite("approval schemes", () => {
	test("renders governance groups and workflows with their resolved names", async () => {
		const rendered = await approvalSchemeToStringConverter(
			[
				{ approverType: "OWNER" },
				{ approverType: "GOVERNANCE_GROUP", approverId: "gg-1" },
				{ approverType: "WORKFLOW", approverId: "wf-1" },
			],
			cache({ "gg-1": "Managers" }),
			cache({ "wf-1": "Escalate" })
		);

		assert.strictEqual(rendered, "OWNER;GOVERNANCE_GROUP:Managers;WORKFLOW:Escalate");
		assert.strictEqual(await approvalSchemeToStringConverter(undefined, cache({}), cache({})), undefined);
	});

	test("imports access-profile approvers, including an unprefixed governance group", async () => {
		assert.deepStrictEqual(await stringToAccessProfileApprovalSchemeConverter("", cache({}), cache({})), []);

		const schemes = await stringToAccessProfileApprovalSchemeConverter(
			"APP_OWNER;GOVERNANCE_GROUP:Managers;Legacy Group",
			cache({ Managers: "gg-1", "Legacy Group": "gg-2" }),
			cache({})
		);

		assert.deepStrictEqual(schemes, [
			{ approverType: "APP_OWNER", approverId: undefined },
			{ approverType: "GOVERNANCE_GROUP", approverId: "gg-1" },
			{ approverType: "GOVERNANCE_GROUP", approverId: "gg-2" },
		]);
	});

	test("imports role approvers and treats a missing scheme as absent", async () => {
		assert.strictEqual(await stringToRoleApprovalSchemeConverter(undefined, cache({}), cache({})), undefined);
		assert.strictEqual(await stringToRoleApprovalSchemeConverter("", cache({}), cache({})), undefined);

		const schemes = await stringToRoleApprovalSchemeConverter(
			"MANAGER;WORKFLOW:Escalate",
			cache({}),
			cache({ Escalate: "wf-1" })
		);

		assert.deepStrictEqual(schemes, [
			{ approverType: "MANAGER", approverId: undefined },
			{ approverType: "WORKFLOW", approverId: "wf-1" },
		]);
	});
});
