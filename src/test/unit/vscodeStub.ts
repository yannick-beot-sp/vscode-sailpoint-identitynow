import Module = require("module");

/**
 * Unit tests run under Mocha, outside the extension host.
 * Modules that touch the SDK through ISCClient still import vscode at load time.
 */
const moduleLoader = Module as unknown as {
	_load: ((request: string, parent: NodeModule | null, isMain: boolean) => unknown) & { sdk2xVscodeStub?: boolean };
};

if (!moduleLoader._load.sdk2xVscodeStub) {
	const originalLoad = moduleLoader._load;
	const patched = function (request: string, parent: NodeModule | null, isMain: boolean) {
		if (request === "vscode") {
			return {
				version: "1.105.0",
				extensions: {
					getExtension: () => ({ packageJSON: { version: "0.0.0-test" } }),
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
	moduleLoader._load = patched;
}
