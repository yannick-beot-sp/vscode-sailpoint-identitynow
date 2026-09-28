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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sdkEsmRoot = path.join(root, "node_modules/sailpoint-api-client/dist/esm");

// createRequire(import.meta.url) keeps the path relative to the source file.
// Once everything is bundled into out/extension.js, import.meta.url is that
// file, so ../../../snippets/*.json no longer points at the extension root.
// Inline those templates instead. tsc output is unchanged and still resolves
// them from out/commands/...
const inlineSnippetJsonPlugin = {
	name: "inline-snippet-json",
	setup(build) {
		build.onLoad({ filter: /\.ts$/ }, async (args) => {
			const source = await fs.promises.readFile(args.path, "utf8");
			if (!source.includes("snippets/")) {
				return null;
			}
			const watchFiles = [];
			const contents = source.replace(
				/require\((['"])(\.\.\/(?:\.\.\/)*snippets\/[^'"]+\.json)\1\)/g,
				(_match, _quote, rel) => {
					const abs = path.resolve(path.dirname(args.path), rel);
					watchFiles.push(abs);
					return fs.readFileSync(abs, "utf8").trim();
				},
			);
			if (contents === source) {
				return null;
			}
			const withoutRequire = contents
				.replace(/import \{ createRequire \} from "node:module";\r?\n/, "")
				.replace(/const require = createRequire\(import\.meta\.url\);\r?\n/, "");
			return {
				contents: withoutRequire.includes("createRequire") ? contents : withoutRequire,
				loader: "ts",
				watchFiles,
			};
		});
	},
};

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
	plugins: [inlineSnippetJsonPlugin, sailpointEsmPlugin],
	logLevel: "info",
	// CJS deps (tmp, and others) keep require("fs") inside esbuild's CommonJS
	// wrapper. In an ESM bundle that becomes a dynamic require, which throws
	// "Dynamic require of \"fs\" is not supported" because the extension host
	// has no global require. createRequire restores it for those calls.
	banner: {
		js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
	},
};

if (args.has("--watch")) {
	const context = await esbuild.context(options);
	await context.watch();
} else {
	await esbuild.build(options);
}
