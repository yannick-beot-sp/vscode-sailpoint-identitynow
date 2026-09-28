/**
 * Minimal vscode module used when unit tests run as ESM, outside the extension host.
 */
const vscode = {
	version: "1.105.0",
	Uri: {
		parse: (value) => ({ toString: () => value }),
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

export default vscode;
export const version = vscode.version;
export const Uri = vscode.Uri;
export const extensions = vscode.extensions;
export const env = vscode.env;
export const window = vscode.window;
