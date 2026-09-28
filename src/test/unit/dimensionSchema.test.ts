import * as assert from "assert";
import { dimensionSchemaToString, stringToDimensionAttributes } from "../../utils/dimensionUtils.js";

suite("dimension schema", () => {
	test("joins attribute names for export", () => {
		assert.strictEqual(dimensionSchemaToString(undefined), undefined);
		assert.strictEqual(
			dimensionSchemaToString({
				dimensionAttributes: [{ name: "department" }, { name: "costCenter" }],
			}),
			"department;costCenter"
		);
	});

	test("builds derived attributes and a display name from the CSV", () => {
		assert.strictEqual(stringToDimensionAttributes(undefined), undefined);
		assert.strictEqual(stringToDimensionAttributes("  "), undefined);
		assert.deepStrictEqual(stringToDimensionAttributes("department; costCenter;;"), {
			dimensionAttributes: [
				{ name: "department", displayName: "Department", derived: true },
				{ name: "costCenter", displayName: "Cost Center", derived: true },
			],
		});
	});
});
