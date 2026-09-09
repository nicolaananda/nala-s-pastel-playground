import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createSeoPages, fixedPages, validSlug } from '../shared/seo.js';

const queues = new Map();
const fixedFiles = new Set(['index.html','berita-lomba/index.html',...fixedPages.map(([route]) => `${route.slice(1)}/index.html`)]);
const validPage = file => typeof file === 'string' && (fixedFiles.has(file) || /^(buku|berita-lomba)\/[^/]+\/index\.html$/.test(file) && validSlug(file.split('/')[1]));
const optionalJson = async file => {
  try { return JSON.parse(await fs.readFile(file,'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};

// Resolve the deployment symlink once per run; never follow symlinks below it.
async function safePath(root, relative) {
  let current = root;
  for (const part of relative.split('/')) {
    if (!part || part === '.' || part === '..') throw new Error('Unsafe SEO path');
    current = path.join(current,part);
    try {
      const stat = await fs.lstat(current);
      if (stat.isSymbolicLink()) throw new Error(`SEO symlink rejected: ${relative}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}

export function refreshSeoSnapshots({outputDir,loadContent}) {
  if (!outputDir || !path.isAbsolute(outputDir)) return Promise.reject(new Error('SEO_OUTPUT_DIR must be an explicit absolute path'));
  const key = path.resolve(outputDir);
  const task = (queues.get(key) || Promise.resolve()).catch(() => {}).then(async () => {
    const root = await fs.realpath(key);
    for (const name of ['.seo-shell.html','.seo-assets.json','.seo-manifest.json']) await safePath(root,name);
    const shell = await fs.readFile(path.join(root,'.seo-shell.html'),'utf8');
    const assets = await optionalJson(path.join(root,'.seo-assets.json')) || {};
    const manifest = await optionalJson(path.join(root,'.seo-manifest.json')) || {version:1,files:[]};
    if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.every(validPage)) throw new Error('Invalid SEO manifest path');
    // Complete loading, validation and rendering before touching any last-good output.
    const result = createSeoPages(shell,await loadContent(),assets);
    const files = Object.keys(result.pages);
    if (!files.every(validPage)) throw new Error('Invalid generated SEO path');
    const output = {...result.pages,'sitemap.xml':result.sitemap,'.seo-manifest.json':JSON.stringify({version:1,files})};
    for (const name of new Set([...Object.keys(output),...manifest.files])) await safePath(root,name);
    const staged = [];
    try {
      // Stage every file before any rename. Each visible file is replaced atomically.
      for (const [name,html] of Object.entries(output)) {
        const target = await safePath(root,name);
        await fs.mkdir(path.dirname(target),{recursive:true});
        const temp = path.join(path.dirname(target),`.seo-${randomUUID()}.tmp`);
        staged.push({temp,target,name});
        await fs.writeFile(temp,html,{flag:'wx',mode:0o644});
      }
      for (const entry of staged.filter(e => e.name !== '.seo-manifest.json')) await fs.rename(entry.temp,entry.target);
      for (const name of manifest.files.filter(name => !files.includes(name))) {
        // Only tracked index files; leave directories and unrelated user uploads intact.
        const target = await safePath(root,name);
        await fs.unlink(target).catch(error => { if (error.code !== 'ENOENT') throw error; });
      }
      const last = staged.find(e => e.name === '.seo-manifest.json');
      await fs.rename(last.temp,last.target);
    } finally {
      await Promise.all(staged.map(({temp}) => fs.unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; })));
    }
    return {pages:files.length,books:result.content.books.length,articles:result.content.articles.length};
  });
  queues.set(key,task);
  void task.finally(() => { if (queues.get(key) === task) queues.delete(key); }).catch(() => {});
  return task;
}
