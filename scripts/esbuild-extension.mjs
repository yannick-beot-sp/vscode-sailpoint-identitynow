/**
 * Bundle the extension and sailpoint-api-client into out/extension.js.
 *
 * Source imports sailpoint-api-client/dist/.../*.js so Node's ESM loader
 * (tests, tsc) hits the CommonJS build. That build's barrel require()s every
 * API, so bundling it keeps the whole SDK. The package export "./dist/*.js"
 * points at those CJS files and wins over the ESM condition.
 *
 * This plugin rewrites those specifiers to dist/esm only for the bundle.
 * esbuild can then tree-shake unused API partitions. The extension host never
 * loads those ESM files itself: they are inlined into out/extension.js.
 */
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdkEsmRoot = path.join(root, "node_modules/sailpoint-api-client/dist/esm");

const sailpointEsmPlugin = {
	name: "sailpoint-api-client-esm",
	setup(build) {
		build.onResolve({ filter: /^sailpoint-api-client\/dist\/.+\.js$/ }, (args) => {
			const subpath = args.path.slice("sailpoint-api-client/dist/".length);
			return { path: path.join(sdkEsmRoot, subpath) };
		});
	},
};

const args = new Set(process.argv.slice(2));

const options = {
	absWorkingDir: root,
	entryPoints: ["src/extension.ts"],
	bundle: true,
	outfile: "out/extension.js",
	external: ["vscode", "esbuild", "@swc/core", "@swc/wasm"],
	format: "esm",
	platform: "node",
	minify: args.has("--minify"),
	sourcemap: args.has("--sourcemap"),
	plugins: [sailpointEsmPlugin],
	logLevel: "info",
};

if (args.has("--watch")) {
	const context = await esbuild.context(options);
	await context.watch();
} else {
	await esbuild.build(options);
}
