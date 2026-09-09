import fs from 'node:fs/promises';
import path from 'node:path';
import { refreshSeoSnapshots } from '../server/seo-snapshots.js';

// Build only ever writes dist, never SEO_OUTPUT_DIR (the live server's target).
const outputDir = path.resolve('dist');
const base = process.env.SEO_CMS_URL || 'http://localhost:8723';
const loadContent = async () => {
  const fetchItems = async type => {
    const response = await fetch(`${base}/api/content/${type}`,{signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error(`CMS ${type}: HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error(`CMS ${type}: invalid items`);
    return data.items;
  };
  const [books,articles] = await Promise.all(['book','article'].map(fetchItems));
  return {books,articles};
};
const shell = await fs.readFile(path.join(outputDir,'index.html'),'utf8');
if (!shell.includes('<div id="root"></div>')) throw new Error('Run vite build first: expected unmodified HTML shell');
const webp = await fs.readdir(path.join(outputDir,'assets/webp'));
const image = prefix => {
  const name = webp.find(name => name.startsWith(prefix) && name.endsWith('.webp'));
  if (!name) throw new Error(`Missing built book image: ${prefix}`);
  return `/assets/webp/${name}`;
};
const bookImages = {
  'tips-trik-juara-1-lomba-mewarnai':image('tips-trik-juara-1-lomba-mewarnai-1-'),
  'lets-coloring-your-anime':image('NEW-Lets-Coloring-Your-Anime-'),
  'coloring-worksheet-juara-1-lomba-mewarnai':image('Coloring_Work_Sheet_Juara1_lomba_mewarnai-'),
};
await fs.writeFile(path.join(outputDir,'.seo-shell.html'),shell);
await fs.writeFile(path.join(outputDir,'.seo-assets.json'),JSON.stringify({bookImages}));
const result = await refreshSeoSnapshots({outputDir,loadContent});
console.log(`SEO snapshots: ${result.pages} routes, ${result.books} published books, ${result.articles} published articles; sitemap from CMS updatedAt.`);
