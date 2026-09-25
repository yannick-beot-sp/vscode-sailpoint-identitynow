#!/usr/bin/env node
/**
 * Migrates sailpoint-api-client imports for SDK 2.x:
 * - API classes stay on 'sailpoint-api-client'
 * - Model/types move to sailpointCompat
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const COMPAT_BASENAME = 'sailpointCompat';

const API_KEEP = new Set(['Configuration', 'Paginator', 'axiosRetry']);

function isApiClass(name) {
	const bare = name.replace(/^type\s+/, '').trim();
	if (API_KEEP.has(bare)) {
		return true;
	}
	return bare.endsWith('Api');
}

function walkDir(dir, files = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules') {
			continue;
		}
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walkDir(full, files);
		} else if (/\.tsx?$/.test(entry.name) && entry.name !== `${COMPAT_BASENAME}.ts`) {
			files.push(full);
		}
	}
	return files;
}

function getCompatImportPath(filePath) {
	let rel = path.relative(path.dirname(filePath), path.join(SRC_DIR, COMPAT_BASENAME));
	rel = rel.replace(/\\/g, '/');
	if (!rel.startsWith('.')) {
		rel = './' + rel;
	}
	return rel;
}

function parseSpecifiers(specBlock) {
	return specBlock
		.split(',')
		.map(s => s.trim())
		.filter(Boolean);
}

function formatImportLine(isTypeOnly, specifiers, modulePath) {
	const unique = [...new Set(specifiers)];
	const body = unique.join(', ');
	if (isTypeOnly) {
		return `import type { ${body} } from '${modulePath}';`;
	}
	return `import { ${body} } from '${modulePath}';`;
}

function processFile(filePath) {
	const original = fs.readFileSync(filePath, 'utf8');
	const importRe = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]sailpoint-api-client['"];?\s*\n?/g;

	let match;
	const blocks = [];
	while ((match = importRe.exec(original)) !== null) {
		blocks.push({
			full: match[0],
			isTypeOnly: Boolean(match[1]),
			specifiers: parseSpecifiers(match[2]),
			index: match.index,
		});
	}

	if (blocks.length === 0) {
		return false;
	}

	const apiSpecs = [];
	const compatSpecs = [];
	let anyTypeOnly = false;

	for (const block of blocks) {
		if (block.isTypeOnly) {
			anyTypeOnly = true;
		}
		for (const spec of block.specifiers) {
			const bare = spec.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
			if (isApiClass(bare)) {
				apiSpecs.push(spec);
			} else {
				compatSpecs.push(spec);
			}
		}
	}

	// Remove all old import blocks (require trailing newline so inline imports aren't corrupted)
	let content = original.replace(
		/import\s+(type\s+)?\{[^}]+\}\s+from\s+['"]sailpoint-api-client['"];?\s*\n/g,
		''
	);

	const compatPath = getCompatImportPath(filePath);
	const newImports = [];

	if (apiSpecs.length > 0) {
		newImports.push(formatImportLine(false, apiSpecs, 'sailpoint-api-client'));
	}
	if (compatSpecs.length > 0) {
		newImports.push(formatImportLine(anyTypeOnly && apiSpecs.length === 0, compatSpecs, compatPath));
	}

	// Insert after last existing import or at top
	const importInsertRe = /^((?:import\s+[\s\S]*?;\s*\n)*)/;
	const insertMatch = content.match(importInsertRe);
	if (insertMatch) {
		content = insertMatch[1] + newImports.join('\n') + '\n' + content.slice(insertMatch[1].length);
	} else {
		content = newImports.join('\n') + '\n\n' + content;
	}

	if (content !== original) {
		fs.writeFileSync(filePath, content, 'utf8');
		return true;
	}
	return false;
}

const files = walkDir(SRC_DIR);
let changed = 0;
for (const file of files) {
	if (processFile(file)) {
		changed++;
		console.log('Updated:', path.relative(ROOT, file));
	}
}
console.log(`\nDone. Updated ${changed} file(s).`);
