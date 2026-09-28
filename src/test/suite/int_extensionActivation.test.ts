import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension activation", () => {
	test("activates in the extension host", async () => {
		const extension = vscode.extensions.getExtension("yannick-beot-sp.vscode-sailpoint-identitynow");
		assert.ok(extension, "extension is present in the test host");
		await extension.activate();
		assert.strictEqual(extension.isActive, true);
	});
});
