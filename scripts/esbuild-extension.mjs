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

// @frontmcp/sdk references these packages from code paths this extension never
// runs (MCP UI widgets, the built-in Express host). Aliasing them keeps the
// real packages out of the bundle. Calling the stubs throws.
const UIPACK_STUB = `
function notBundled(name) {
	throw new Error("@frontmcp/uipack is not bundled (" + name + ")");
}
const fn = (name) => () => notBundled(name);
export const MCP_APPS_MIME_TYPE = "text/html;profile=mcp-app";
export const MCP_APPS_EXTENSION_ID = "mcp-app";
export const renderToolTemplate = fn("renderToolTemplate");
export const detectUIType = fn("detectUIType");
export const createDefaultBaseTemplate = fn("createDefaultBaseTemplate");
export const buildCDNInfoForUIType = fn("buildCDNInfoForUIType");
export const buildToolResponseContent = fn("buildToolResponseContent");
export const isUIRenderFailure = fn("isUIRenderFailure");
export const resolveServingMode = fn("resolveServingMode");
export const detectContentType = fn("detectContentType");
export const buildChartHtml = fn("buildChartHtml");
export const buildMermaidHtml = fn("buildMermaidHtml");
export const buildPdfHtml = fn("buildPdfHtml");
export const wrapDetectedContent = fn("wrapDetectedContent");
export const escapeHtml = fn("escapeHtml");
export const createTemplateHelpers = fn("createTemplateHelpers");
export const createResolverWithOverrides = fn("createResolverWithOverrides");
export const renderComponent = fn("renderComponent");
export const isUIType = fn("isUIType");
export const buildShell = fn("buildShell");
export default notBundled;
`;

const EXPRESS_STUB = `
function express() {
	throw new Error("express is not bundled; the MCP server uses node:http");
}
express.json = () => express;
express.urlencoded = () => express;
express.Router = express;
express.static = express;
export default express;
`;

const CORS_STUB = `
export default function cors() {
	throw new Error("cors is not bundled; the MCP server does not enable CORS");
}
`;

// raw-body (imported by @frontmcp/sdk) require()s iconv-lite for every body.
// The MCP server only accepts UTF-8 JSON, so the CJK encoding tables can go.
const ICONV_STUB = `
var UTF8 = { "utf8": 1, "utf-8": 1, "unicode-1-1-utf-8": 1 };
function normalize(encoding) {
	return String(encoding == null ? "" : encoding).trim().toLowerCase();
}
function assertUtf8(encoding) {
	if (!UTF8[normalize(encoding)]) {
		throw new Error("Encoding not recognized: '" + encoding + "'");
	}
}
function decode(buffer, encoding) {
	assertUtf8(encoding);
	return Buffer.from(buffer).toString("utf8");
}
function encode(content, encoding) {
	assertUtf8(encoding);
	return Buffer.from(String(content), "utf8");
}
function getDecoder(encoding) {
	assertUtf8(encoding);
	return {
		write: function (chunk) { return Buffer.from(chunk).toString("utf8"); },
		end: function () { return ""; }
	};
}
module.exports = {
	decode: decode,
	encode: encode,
	encodingExists: function (encoding) { return !!UTF8[normalize(encoding)]; },
	getDecoder: getDecoder,
	toEncoding: encode,
	fromEncoding: decode
};
`;

const bundleDietPlugin = {
	name: "bundle-diet",
	setup(build) {
		build.onResolve({ filter: /^@frontmcp\/uipack($|\/)/ }, () => ({
			path: "uipack",
			namespace: "bundle-stub",
		}));
		build.onResolve({ filter: /^express$/ }, () => ({
			path: "express",
			namespace: "bundle-stub",
		}));
		build.onResolve({ filter: /^cors$/ }, () => ({
			path: "cors",
			namespace: "bundle-stub",
		}));
		build.onResolve({ filter: /^iconv-lite$/ }, () => ({
			path: "iconv-lite",
			namespace: "bundle-stub",
		}));
		// express, send, type-is and accepts each ship their own mime-db.
		build.onResolve({ filter: /(?:^|\/)db\.json$/ }, (args) => {
			const importer = args.importer ?? "";
			if (!importer.includes(`${path.sep}mime-db${path.sep}`)) {
				return null;
			}
			return { path: path.join(root, "node_modules/mime-db/db.json") };
		});
		build.onLoad({ filter: /.*/, namespace: "bundle-stub" }, (args) => {
			const contents = args.path === "uipack" ? UIPACK_STUB
				: args.path === "express" ? EXPRESS_STUB
					: args.path === "iconv-lite" ? ICONV_STUB
						: CORS_STUB;
			return { contents, loader: "js" };
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
	plugins: [inlineSnippetJsonPlugin, sailpointEsmPlugin, bundleDietPlugin],
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
