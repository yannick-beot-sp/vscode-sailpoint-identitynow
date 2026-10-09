import * as assert from "assert";
import { describe, it } from "mocha";
import { schemaHasDatasetId, sourceResourceIconName } from "../../utils/sourceResources.js";

suite("Source resources Test Suite", () => {
	describe("schemaHasDatasetId", () => {
		const cases: { name: string; schema: { configuration?: object } | null | undefined; expected: boolean }[] = [
			{ name: "missing schema", schema: undefined, expected: false },
			{ name: "no configuration", schema: {}, expected: false },
			{ name: "empty datasetId", schema: { configuration: { datasetId: "" } }, expected: false },
			{ name: "blank datasetId", schema: { configuration: { datasetId: "  " } }, expected: false },
			{ name: "dataset schema", schema: { configuration: { datasetId: "azure:foundry" } }, expected: true },
		];
		cases.forEach(({ name, schema, expected }) => {
			it(name, () => {
				assert.strictEqual(schemaHasDatasetId(schema), expected);
			});
		});
	});

	describe("sourceResourceIconName", () => {
		const cases: { type: string | undefined; icon: string }[] = [
			{ type: "std:account", icon: "account" },
			{ type: "std:access", icon: "shield" },
			{ type: "std:agent", icon: "hubot" },
			{ type: "std:capability", icon: "tools" },
			{ type: "std:application", icon: "window" },
			{ type: "std:credential", icon: "key" },
			{ type: "std:resource", icon: "package" },
			{ type: undefined, icon: "package" },
		];
		cases.forEach(({ type, icon }) => {
			it(`maps ${type ?? "undefined"} to ${icon}`, () => {
				assert.strictEqual(sourceResourceIconName(type), icon);
			});
		});
	});
});
