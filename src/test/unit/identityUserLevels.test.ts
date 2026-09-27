import * as assert from "assert";
import { AuthUserV2025CapabilitiesV2025, UserLevelSummaryDTOV2025 } from "sailpoint-api-client";
import {
	compareUserLevels,
	getOotbUserLevels,
	getUserLevelCapabilityValue,
	isAdminUserLevel,
	isUserLevelAssigned,
	mergeUserLevels,
} from "../../commands/identity/identityUserLevels";

suite("identity user levels", () => {
	test("labels every SDK capability and keeps the wire value as legacyGroup", () => {
		const levels = getOotbUserLevels();
		const byCapability = new Map(levels.map(level => [level.legacyGroup, level.name]));

		assert.strictEqual(levels.length, Object.values(AuthUserV2025CapabilitiesV2025).length);
		assert.ok(levels.every(level => level.custom === false));
		assert.strictEqual(byCapability.get("ORG_ADMIN"), "Admin");
		assert.strictEqual(byCapability.get("HELPDESK"), "Helpdesk");
		assert.strictEqual(byCapability.get("das:ui-administrator"), "Data Access Security Administrator");
		assert.strictEqual(byCapability.get("sp:ui-config-hub-read"), "Config Hub Read");
	});

	test("recognizes an admin by legacy group or by the Admin name", () => {
		assert.strictEqual(isAdminUserLevel({ legacyGroup: "ORG_ADMIN", name: "Something" }), true);
		assert.strictEqual(isAdminUserLevel({ name: "ADMIN" }), true);
		assert.strictEqual(isAdminUserLevel({ legacyGroup: "HELPDESK", name: "Helpdesk" }), false);
	});

	test("sorts admins first, standard levels next, then custom levels by name", () => {
		const levels: UserLevelSummaryDTOV2025[] = [
			{ name: "Zulu", legacyGroup: "HELPDESK", custom: false },
			{ name: "Custom", legacyGroup: "custom-role", custom: true },
			{ name: "Admin", legacyGroup: "ORG_ADMIN", custom: false },
			{ name: "Alpha", legacyGroup: "ROLE_ADMIN", custom: false },
		];

		assert.deepStrictEqual(
			[...levels].sort(compareUserLevels).map(level => level.name),
			["Admin", "Alpha", "Zulu", "Custom"]
		);
	});

	test("matches an assignment on the capability value or the level id", () => {
		assert.strictEqual(getUserLevelCapabilityValue({ legacyGroup: "ORG_ADMIN", id: "level-1" }), "ORG_ADMIN");
		assert.strictEqual(getUserLevelCapabilityValue({ id: "level-1" }), "level-1");
		assert.strictEqual(isUserLevelAssigned({ legacyGroup: "HELPDESK", id: "level-2" }, ["level-2"]), true);
		assert.strictEqual(isUserLevelAssigned({ legacyGroup: "HELPDESK", id: "level-2" }, ["CERT_ADMIN"]), false);
	});

	test("lets a custom level replace the built-in one and keeps unknown current capabilities", () => {
		const merged = mergeUserLevels(
			[{ name: "Super Admin", legacyGroup: "ORG_ADMIN", custom: true }, { name: "Ignored", custom: true }],
			["sp:extra"]
		);
		const byCapability = new Map(merged.map(level => [getUserLevelCapabilityValue(level), level]));

		assert.strictEqual(byCapability.get("ORG_ADMIN")?.name, "Super Admin");
		assert.strictEqual(byCapability.get("ORG_ADMIN")?.custom, true);
		assert.strictEqual(byCapability.get("sp:extra")?.name, "sp:extra");
		assert.strictEqual(byCapability.has(""), false);
	});
});
