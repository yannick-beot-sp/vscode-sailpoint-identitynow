import * as assert from "assert";
import { prefersInEditorFileDialog } from "../../utils/quickPickFileDialog.js";

suite("quickPickFileDialog", () => {
    test("uses the in-editor picker in Cursor", () => {
        assert.strictEqual(prefersInEditorFileDialog("Cursor", "vscode"), true);
        assert.strictEqual(prefersInEditorFileDialog("Cursor Nightly", "vscode"), true);
        assert.strictEqual(prefersInEditorFileDialog("Visual Studio Code", "cursor"), true);
    });

    test("keeps the native dialog in VS Code", () => {
        assert.strictEqual(prefersInEditorFileDialog("Visual Studio Code", "vscode"), false);
        assert.strictEqual(prefersInEditorFileDialog("Code - OSS", "vscode"), false);
    });
});
