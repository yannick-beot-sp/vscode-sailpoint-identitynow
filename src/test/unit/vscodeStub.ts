import { createRequire } from "node:module";

/**
 * Unit tests run under Mocha, outside the extension host.
 * Static `import "vscode"` is redirected by src/test/vscodeLoader.mjs.
 * This stub still covers any remaining CommonJS require("vscode").
 */
const require = createRequire(import.meta.url);
const Module = require("node:module") as {
	_load: ((request: string, parent: NodeModule | null, isMain: boolean) => unknown) & { sdk2xVscodeStub?: boolean };
};

if (!Module._load.sdk2xVscodeStub) {
	const originalLoad = Module._load;
	const patched = function (request: string, parent: NodeModule | null, isMain: boolean) {
		if (request === "vscode") {
			return {
				version: "1.105.0",
				Uri: {
					parse: (value: string) => ({ toString: () => value }),
				},
				extensions: {
					getExtension: () => ({ packageJSON: { version: "0.0.0-test" } }),
				},
				env: {
					clipboard: { writeText: async () => undefined },
					openExternal: async () => true,
				},
				window: {
					showInformationMessage: () => undefined,
					showWarningMessage: () => undefined,
					showErrorMessage: () => undefined,
				},
			};
		}
		return originalLoad(request, parent, isMain);
	};
	patched.sdk2xVscodeStub = true;
	Module._load = patched;
}
