import * as assert from "assert";
import { AccessDurationV2025TimeUnitV2025 } from "sailpoint-api-client";
import { formatMaxPermittedAccessDuration } from "../../utils/maxPermittedAccessDuration";

suite("max permitted access duration", () => {
	test("omits the duration when the value or the unit is missing", () => {
		assert.strictEqual(formatMaxPermittedAccessDuration(undefined, "DAYS"), null);
		assert.strictEqual(formatMaxPermittedAccessDuration(0, "DAYS"), null);
		assert.strictEqual(formatMaxPermittedAccessDuration(5, undefined), null);
		assert.strictEqual(formatMaxPermittedAccessDuration(5, ""), null);
	});

	test("builds the SDK duration for a known time unit", () => {
		assert.deepStrictEqual(
			formatMaxPermittedAccessDuration(12, AccessDurationV2025TimeUnitV2025.Hours),
			{ value: 12, timeUnit: "HOURS" }
		);
	});

	test("rejects a time unit outside the SDK enum", () => {
		assert.throws(
			() => formatMaxPermittedAccessDuration(1, "years"),
			/Invalid value for maxPermittedAccessDurationTimeUnit:years\. Expecting one of HOURS, DAYS, WEEKS, MONTHS/
		);
	});
});
