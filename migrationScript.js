#!/usr/bin/env node
/**
 * Migration script: sailpoint-api-client 1.x → 2.0
 * Source: https://github.com/sailpoint-oss/typescript-sdk-template/blob/main/migrationScript.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || '.');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt']);
const PKG = 'sailpoint-api-client';

let scanned = 0;
let changed = 0;

const API_CLASS_RE = /^[A-Z][A-Za-z0-9]*Api$/;
const NERM_CLASS_RE = /NERM(?:V\d{4})?Api$/;
const VERSIONED_CLASS_RE = /\b([A-Z][A-Za-z0-9]*?)(?:Beta|V\d{4})Api\b/g;
const VERSIONED_METHOD_RE = /V\d+$/;
const API_VERB_RE = /^(list|get|create|update|delete|patch|put|post|submit|cancel|approve|reject|enable|disable|reset|search|send|import|export|download|upload|validate|test|run|generate|check|sync|refresh|complete|forward|acknowledge|bulk|set|invoke|unlock|lock)/;

function walk(dir) {
 let entries;
 try {
 entries = fs.readdirSync(dir, { withFileTypes: true });
 } catch {
 return;
 }
 for (const entry of entries) {
 const full = path.join(dir, entry.name);
 if (entry.isDirectory()) {
 if (!SKIP_DIRS.has(entry.name)) walk(full);
 } else if (entry.isFile()) {
 const ext = path.extname(entry.name);
 if (['.ts', '.js', '.mts', '.mjs', '.cts', '.cjs'].includes(ext) || entry.name === 'package.json') {
 processFile(full);
 }
 }
 }
}

function escapeRe(s) {
 return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function bumpPackageJson(text) {
 try {
 const pkg = JSON.parse(text);
 let bumped = false;
 for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
 if (pkg[section] && pkg[section][PKG]) {
 pkg[section][PKG] = '^2.0.0';
 bumped = true;
 }
 }
 return bumped ? JSON.stringify(pkg, null, 2) + '\n' : text;
 } catch {
 return text;
 }
}

function collapseClassNames(text) {
 return text.replace(VERSIONED_CLASS_RE, (match, base) => {
 if (/NERM$/.test(base)) return match;
 return `${base}Api`;
 });
}

function dedupeImports(text) {
 const importRe = new RegExp(
 `import(\\s+type)?\\s*\\{([^}]*)\\}\\s*from\\s*(["'])${escapeRe(PKG)}\\3`,
 'g'
 );
 return text.replace(importRe, (match, typeKw, names, quote) => {
 const seen = new Set();
 const kept = [];
 for (const raw of names.split(',')) {
 const name = raw.trim();
 if (!name) continue;
 if (seen.has(name)) continue;
 seen.add(name);
 kept.push(name);
 }
 return `import${typeKw || ''} { ${kept.join(', ')} } from ${quote}${PKG}${quote}`;
 });
}

function findApiInstanceVars(text) {
 const vars = new Set();
 const re = /(\w+)\s*=\s*new\s+(?:SailPoint\.)?([A-Z][A-Za-z0-9]*Api)\b/g;
 let m;
 while ((m = re.exec(text)) !== null) {
 const [, varName, className] = m;
 if (!API_CLASS_RE.test(className)) continue;
 if (NERM_CLASS_RE.test(className)) continue;
 vars.add(varName);
 }
 return vars;
}

function versionApiMethods(text, vars) {
 if (vars.size === 0) return text;
 const alt = [...vars].map(escapeRe).join('|');

 let out = text;

 const callRe = new RegExp(`\\b(${alt})\\.([A-Za-z][A-Za-z0-9]*)(?=\\s*\\()`, 'g');
 out = out.replace(callRe, (match, varName, method) => {
 if (VERSIONED_METHOD_RE.test(method)) return match;
 return `${varName}.${method}V1`;
 });

 const refRe = new RegExp(`\\b(${alt})\\.([A-Za-z][A-Za-z0-9]*)\\b(?!\\s*\\()`, 'g');
 out = out.replace(refRe, (match, varName, method) => {
 if (VERSIONED_METHOD_RE.test(method)) return match;
 if (!API_VERB_RE.test(method)) return match;
 return `${varName}.${method}V1`;
 });

 return out;
}

function applyReplacements(text, file) {
 if (path.basename(file) === 'package.json') {
 return bumpPackageJson(text);
 }

 let out = text;
 out = collapseClassNames(out);
 out = dedupeImports(out);
 out = versionApiMethods(out, findApiInstanceVars(out));
 return out;
}

function processFile(file) {
 scanned++;
 let original;
 try {
 original = fs.readFileSync(file, 'utf8');
 } catch {
 return;
 }

 const updated = applyReplacements(original, file);

 if (updated !== original) {
 fs.writeFileSync(file, updated, 'utf8');
 console.log(` updated ${path.relative(ROOT, file)}`);
 changed++;
 }
}

module.exports = { applyReplacements };

if (require.main === module) {
 console.log(`\nSailPoint typescript-sdk 1.x → 2.0 migration`);
 console.log(`Target: ${ROOT}\n`);

 walk(ROOT);

 console.log(`\n${changed} file(s) changed out of ${scanned} scanned.\n`);
}
