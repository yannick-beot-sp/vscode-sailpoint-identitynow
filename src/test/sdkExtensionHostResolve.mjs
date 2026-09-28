/**
 * The extension host resolves sailpoint-api-client with Node's native ESM loader.
 * Unit tests do not: vscodeLoader.mjs appends ".js" to extensionless relative
 * imports, so the broken dist/esm build still loads under mocha.
 *
 * Import every specifier the extension source uses, the same way activation does.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const srcDir = path.join(root, "src");
const specifierPattern = /(?:from|import)\s*\(?\s*['"](sailpoint-api-client(?:\/[^'"]*)?)['"]/g;

async function collectTypeScriptFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules" || entry.name === "app") {
				continue;
			}
			files.push(...await collectTypeScriptFiles(full));
		} else if (entry.name.endsWith(".ts")) {
			files.push(full);
		}
	}
	return files;
}

const specifiers = new Set();
for (const file of await collectTypeScriptFiles(srcDir)) {
	const text = await readFile(file, "utf8");
	for (const match of text.matchAll(specifierPattern)) {
		specifiers.add(match[1]);
	}
}

if (specifiers.size === 0) {
	console.error("No sailpoint-api-client imports found under src/");
	process.exit(1);
}

const failures = [];
for (const specifier of [...specifiers].sort()) {
	let resolved;
	try {
		resolved = import.meta.resolve(specifier);
	} catch (error) {
		failures.push(`${specifier}: ${error.message}`);
		continue;
	}
	if (resolved.includes("/dist/esm/")) {
		failures.push(
			`${specifier} resolves to the ESM build (${resolved}). `
			+ "That build imports './common' without a file extension, which the extension host cannot load. "
			+ "Import sailpoint-api-client/dist/.../*.js so Node uses the CommonJS build."
		);
		continue;
	}
	try {
		await import(specifier);
	} catch (error) {
		failures.push(`${specifier}: ${error.message}`);
	}
}

if (failures.length > 0) {
	console.error(`sailpoint-api-client cannot be loaded the way the extension host loads it:\n${failures.join("\n")}`);
	process.exit(1);
}

console.log(`Resolved ${specifiers.size} sailpoint-api-client imports with the extension host loader`);
