/**
 * Node ESM resolve hook: unit tests import "vscode", which only exists in the extension host.
 */
export async function resolve(specifier, context, nextResolve) {
	if (specifier === "vscode") {
		return {
			shortCircuit: true,
			url: new URL("./vscode-mock.mjs", import.meta.url).href,
		};
	}
	try {
		return await nextResolve(specifier, context);
	} catch (error) {
		// sailpoint-api-client's ESM build uses extensionless relative imports.
		// This retry lets unit tests load that build. The extension host does not
		// use this hook; sdkExtensionHostResolve.mjs checks the real resolution.
		if (
			error?.code === "ERR_MODULE_NOT_FOUND"
			&& specifier.startsWith(".")
			&& !/\.[^/]+$/.test(specifier)
		) {
			return nextResolve(`${specifier}.js`, context);
		}
		throw error;
	}
}
