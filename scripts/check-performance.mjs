import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const dir = new URL('../dist/assets/js/', import.meta.url);
const files = await readdir(dir);
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const entry = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert(entry, 'built entry script missing');
const entryFile = entry.split('/').at(-1);
const entryBytes = (await stat(new URL(entryFile, dir))).size;
assert(entryBytes < 90_000, `shared entry is ${entryBytes} bytes; limit is 90KB`);
const source = await readFile(new URL('../src/pages/Index.tsx', import.meta.url), 'utf8');
assert(source.includes('<Deferred'), 'home below-fold sections must remain deferred');
assert(files.some(name => /^grasp-guide-.*\.js$/.test(name)), 'Grasp must remain a separate chunk');
assert(files.some(name => /^AdminDashboard-.*\.js$/.test(name)), 'admin must remain a separate chunk');
console.log(`performance contracts pass: entry ${entryBytes} bytes; deferred home; admin/Grasp split`);
