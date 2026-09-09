import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const shared = await import('../shared/seo.js').catch(() => ({}));
const storage = await import('../server/seo-snapshots.js').catch(() => ({}));
const shell = '<!doctype html><html><head><title>Old</title><meta name="description" content="old"><meta property="og:image:width" content="1200"><script type="module" src="/assets/app.js"></script></head><body><div id="root"></div></body></html>';
const book = { type: 'book', slug: 'new-book', title: 'Buku <Nala> & teman', description: 'Paragraf pembuka.\n\n**Teknik Warna**\n\nSeluruh penjelasan akhir.', price: 49000, imageUrl: '/book.webp', status: 'published', updatedAt: '2026-07-02T03:04:05.000Z', createdAt: '2026-07-01T00:00:00.000Z', fileUrl: 'PRIVATE_DOWNLOAD', metadata: { password: 'PRIVATE_PASSWORD', shortDescription: 'Ringkasan', videos: [{title:'Video',url:'https://www.youtube.com/shorts/gsJayG1TZco'}] } };
const article = { ...book, type: 'article', slug: 'new-article', title: 'Artikel Baru', description: '<h1>Artikel Baru</h1><p>Isi &amp; berita <strong>lengkap</strong>.</p><script>alert(1)</script><img src=x onerror=alert(1)>', metadata: {contentFormat:'html', location:'Tangerang', winners:[{name:'A',position:'Juara 1',secret:'PRIVATE_WINNER'}]} };

test('published CMS pages have visible full content, escaped metadata, schemas and real sitemap dates', () => {
  assert.equal(typeof shared.createSeoPages, 'function', 'CMS renderer must exist');
  const { pages, sitemap, content } = shared.createSeoPages(shell, { books: [book, {...book, slug:'draft',status:'draft'}], articles: [article] }, {bookImage:'/default.webp'});
  const html = pages['buku/new-book/index.html'];
  assert.match(html, /<div id="root"><main/);
  assert.match(html, /<h1[^>]*>Buku &lt;Nala&gt; &amp; teman<\/h1>/);
  assert.match(html, /Seluruh penjelasan akhir/);
  assert.match(html, /Rp 49\.000/);
  assert.match(html, /https:\/\/artstudionala.com\/book.webp/);
  assert.match(html, /"@type":"Product"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.equal((html.match(/<title>/g)||[]).length,1);
  assert.doesNotMatch(html, /og:image:width|PRIVATE_|<noscript/);
  assert.match(pages['berita-lomba/new-article/index.html'], /"dateModified":"2026-07-02T03:04:05.000Z"/);
  assert.equal((pages['berita-lomba/new-article/index.html'].match(/<h1[ >]/g)||[]).length,1);
  assert.doesNotMatch(pages['berita-lomba/new-article/index.html'], /<script>alert|onerror=/);
  assert.match(sitemap, /<lastmod>2026-07-02T03:04:05.000Z<\/lastmod>/);
  assert.match(sitemap, /<url><loc>https:\/\/artstudionala.com\/<\/loc><\/url>/);
  assert.doesNotMatch(sitemap, /draft|admin|sketch-premium/);
  assert.doesNotMatch(JSON.stringify(content), /PRIVATE_|fileUrl/);
  assert.doesNotMatch(pages['index.html'], /<(?:iframe|img)[^>]+(?:youtube|ytimg)|rel="(?:preconnect|dns-prefetch)"[^>]+youtube/);
  assert.match(pages['index.html'], /1 Buku Best Seller/);
});

test('bad slugs and malformed public data fail closed before generating pages', () => {
  assert.equal(typeof shared.createSeoPages, 'function');
  for (const slug of ['../outside','x/y','%2e%2e','UPPER','', 'a'.repeat(181)]) {
    assert.throws(() => shared.createSeoPages(shell,{books:[{...book,slug}],articles:[]},{bookImage:'/default.webp'}), /slug/i);
  }
  assert.throws(() => shared.createSeoPages(shell,{books:[{...book,price:-1}],articles:[]},{bookImage:'/default.webp'}), /price/i);
  assert.throws(() => shared.createSeoPages(shell,{books:null,articles:[]}), /CMS/i);
});

test('refresh is serialized, removes only tracked pages, and keeps last-good on load/render/path failures', async () => {
  assert.equal(typeof storage.refreshSeoSnapshots, 'function', 'atomic refresh must exist');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(),'nala-seo-'));
  await fs.writeFile(path.join(dir,'.seo-shell.html'),shell);
  await fs.writeFile(path.join(dir,'.seo-assets.json'),JSON.stringify({bookImage:'/default.webp'}));
  await fs.writeFile(path.join(dir,'keep.txt'),'untouched');
  const run = (data) => storage.refreshSeoSnapshots({outputDir:dir,loadContent:async()=>data});
  await run({books:[book],articles:[article]});
  const before = await fs.readFile(path.join(dir,'index.html'),'utf8');
  await assert.rejects(storage.refreshSeoSnapshots({outputDir:dir,loadContent:async()=>{throw new Error('CMS offline');}}), /CMS offline/);
  await assert.rejects(run({books:[{...book,slug:'../bad'}],articles:[]}), /slug/i);
  assert.equal(await fs.readFile(path.join(dir,'index.html'),'utf8'),before);
  let active=0,max=0;
  const delayed = () => storage.refreshSeoSnapshots({outputDir:dir,loadContent:async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,15));active--;return {books:[],articles:[]};}});
  await Promise.all([delayed(),delayed()]);
  assert.equal(max,1);
  await assert.rejects(fs.stat(path.join(dir,'buku/new-book/index.html')), {code:'ENOENT'});
  assert.equal(await fs.readFile(path.join(dir,'keep.txt'),'utf8'),'untouched');
  await fs.writeFile(path.join(dir,'.seo-manifest.json'), JSON.stringify({version:1,files:['../keep.txt']}));
  await assert.rejects(run({books:[],articles:[]}), /manifest|path/i);
  await fs.writeFile(path.join(dir,'.seo-manifest.json'), JSON.stringify({version:1,files:[]}));
  const outside=await fs.mkdtemp(path.join(os.tmpdir(),'nala-seo-outside-'));
  await fs.rmdir(path.join(dir,'buku/new-book')).catch(()=>{});
  await fs.symlink(outside,path.join(dir,'buku/new-book'));
  await assert.rejects(run({books:[book],articles:[]}), /symlink/i);
  assert.deepEqual(await fs.readdir(outside),[]);
  // Only test-owned temporary directories; production cleanup never uses recursive deletion.
  await fs.rm(dir,{recursive:true,force:true});
  await fs.rm(outside,{recursive:true,force:true});
});

test('React headings and routing do not revive missing dynamic pages', async () => {
  const read = p=>fs.readFile(new URL(`../${p}`,import.meta.url),'utf8');
  const detail=await read('src/pages/BookDetail.tsx');
  assert.match(detail, /<h1 className="text-2xl/);
  assert.match(await read('src/components/BestSellerBooks.tsx'), /\{books.length\} Buku Best Seller/);
  assert.doesNotMatch(await read('.htaccess'), /RewriteCond %\{REQUEST_URI\} \^\/\(buku\/\[\^\/\]\+/);
});
