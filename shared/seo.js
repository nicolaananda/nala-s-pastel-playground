import { getBookVideos } from './book-videos.js';

export const SITE = 'https://artstudionala.com';
export const HOME_TITLE = 'Nala Art Studio - Kelas Mewarnai, Menggambar & Art Therapy';
export const HOME_DESCRIPTION = 'Kelas seni untuk anak dan dewasa, buku mewarnai, worksheet gratis, serta panduan menggambar dari Nala Art Studio.';
export const validSlug = (value) => typeof value === 'string' && value.length <= 180 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// ponytail: CMS HTML becomes escaped readable text, not a second rich-text renderer.
export function plainText(value, html = false) {
  let text = String(value ?? '');
  if (html) text = text.replace(/<(script|style|iframe|object|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<\/?(?:p|div|article|section|header|h[1-6]|li|ul|ol|blockquote|br|hr)\b[^>]*>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, entity) => {
      const named = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
      if (entity[0] !== '#') return named[entity.toLowerCase()] || all;
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    });
  return text.replace(/\*\*/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
}

export function publicImage(value) {
  if (!value) return '';
  if (typeof value !== 'string') throw new Error('CMS image URL invalid');
  const url = new URL(value, SITE);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('CMS image URL invalid');
  if (/(^|\.)(youtube\.com|youtube-nocookie\.com|ytimg\.com|youtu\.be)$/.test(url.hostname)) throw new Error('CMS image cannot load YouTube');
  if (url.hostname === 'api.artstudionala.com' || url.hostname.endsWith('.artstudionala.com') || url.hostname === 'artstudionala.com') url.protocol = 'https:';
  return url.href;
}
const isoDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('CMS date invalid');
  return date.toISOString();
};

export function publicSeoContent(data, assets = {}) {
  if (!data || !Array.isArray(data.books) || !Array.isArray(data.articles)) throw new Error('CMS books/articles must be arrays');
  const list = (items, type) => {
    const seen = new Set();
    return items.flatMap(item => {
      if (!item || typeof item !== 'object' || !['published','draft','archived'].includes(item.status)) throw new Error('CMS item/status invalid');
      if (item.status !== 'published') return [];
      if (!validSlug(item.slug) || seen.has(item.slug)) throw new Error('CMS slug invalid or duplicate');
      seen.add(item.slug);
      if (item.type !== type || typeof item.title !== 'string' || !item.title.trim() || typeof item.description !== 'string') throw new Error('CMS title/content invalid');
      const meta = item.metadata || {};
      const description = plainText(item.description, meta.contentFormat === 'html' || meta.editorMode === 'html');
      if (!description) throw new Error('CMS description empty');
      if (type === 'book' && (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) throw new Error('CMS price invalid');
      const metadata = { contentFormat: 'plain' };
      for (const key of ['shortDescription','gradient','displayDate','location']) if (typeof meta[key] === 'string') metadata[key] = plainText(meta[key], true);
      if (typeof meta.featured === 'boolean') metadata.featured = meta.featured;
      if (type === 'book') metadata.videos = getBookVideos(meta.videos);
      if (Array.isArray(meta.winners)) metadata.winners = meta.winners.filter(w => w && typeof w.name === 'string').map(w => ({
        name: w.name, position: typeof w.position === 'string' ? w.position : '',
        ...(w.photo ? {photo: publicImage(w.photo)} : {}),
        ...(w.photoFallback ? {photoFallback: publicImage(w.photoFallback)} : {}),
      }));
      return [{type, slug:item.slug, title:item.title.trim(), description, status:'published',
        sortOrder: Number.isFinite(item.sortOrder) ? item.sortOrder : 0,
        ...(type === 'book' ? {price:item.price} : {}),
        imageUrl: publicImage(item.imageUrl || assets.bookImages?.[item.slug] || (type === 'book' ? assets.bookImage : '')),
        createdAt:isoDate(item.createdAt), updatedAt:isoDate(item.updatedAt), metadata}];
    });
  };
  return { books:list(data.books,'book'), articles:list(data.articles,'article') };
}

export const itemPath = (item) => `/${item.type === 'book' ? 'buku' : 'berita-lomba'}/${item.slug}`;
export function breadcrumb(route, title) {
  const items = [{name:'Beranda',item:`${SITE}/`}];
  if (route.startsWith('/berita-lomba/')) items.push({name:'Berita Lomba',item:`${SITE}/berita-lomba`});
  if (route !== '/') items.push({name:title.replace(/ \| Nala Art Studio$/, ''),item:SITE + route});
  return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((entry,i) => ({'@type':'ListItem',position:i+1,...entry}))};
}
export function itemSchema(item) {
  const url = SITE + itemPath(item);
  const common = {'@context':'https://schema.org',description:plainText(item.description).replace(/\s+/g,' ').slice(0,300),url,
    ...(item.imageUrl ? {image:[publicImage(item.imageUrl)]} : {})};
  if (item.type === 'book') return {...common,'@type':'Product',name:item.title,
    offers:{'@type':'Offer',priceCurrency:'IDR',price:item.price,url}};
  return {...common,'@type':'Article',headline:item.title,mainEntityOfPage:url,
    ...(item.createdAt ? {datePublished:isoDate(item.createdAt)} : {}),
    ...(item.updatedAt ? {dateModified:isoDate(item.updatedAt)} : {}),
    publisher:{'@type':'Organization',name:'Nala Art Studio',url:SITE}};
}

export const fixedPages = [
  ['/grasp-guide-premium','Panduan Premium Grasp','Panduan penggunaan dan teknik mewarnai dengan Grasp. Masukkan kode akses untuk membuka materi premium.',true],
  ['/grasp-sixty-color-premium','Panduan Grasp 60 Warna','Panduan nama, nomor, swatch, dan penggunaan Grasp 60 warna. Materi premium memerlukan kode akses.',true],
  ['/sketch-purchase','Beli Sketch Premium','Dapatkan koleksi sketch premium Nala Art Studio untuk latihan menggambar dan mewarnai.',false],
  ['/sketch-premium','Akses Sketch Premium','Masukkan kode akses pembelian untuk membuka koleksi sketch premium Nala Art Studio.',true],
  ['/admin','Admin Nala Art Studio','Masuk untuk mengelola konten Nala Art Studio.',true],
  ['/admin/login','Login Admin Nala Art Studio','Masuk untuk mengelola konten Nala Art Studio.',true],
];

export function createSeoPages(shell, data, assets = {}) {
  if (typeof shell !== 'string' || !/<div id="root"><\/div>/.test(shell) || !shell.includes('</head>')) throw new Error('SEO shell invalid: requires empty root');
  const content = publicSeoContent(data, assets);
  const pages = {};
  const urls = [];
  const paragraphs = text => text.split(/\n\s*\n/).filter(Boolean).map(p => `<p style="margin:1em 0;white-space:pre-line">${escapeHtml(p)}</p>`).join('');
  const image = item => item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" width="600" style="max-width:100%;height:auto" loading="lazy">` : '';
  const nav = '<nav aria-label="Navigasi"><a href="/">Beranda</a> · <a href="/#buku-best-seller">Buku</a> · <a href="/#kelas-seni">Kelas Seni</a> · <a href="/berita-lomba">Berita Lomba</a></nav>';
  const add = (route,title,description,body,{item,noindex=false} = {}) => {
    const url = SITE + route;
    const ogImage = item?.imageUrl || `${SITE}/og-nala-art-studio.png`;
    const schemas = [...(item ? [itemSchema(item)] : []),breadcrumb(route,title)];
    const metas = `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}"><link rel="canonical" href="${escapeHtml(url)}">` +
      Object.entries({'og:title':title,'og:description':description,'og:url':url,'og:type':item?.type === 'article' ? 'article' : item?.type === 'book' ? 'product' : 'website','og:image':ogImage,'twitter:title':title,'twitter:description':description,'twitter:image':ogImage,'twitter:url':url,'twitter:card':'summary_large_image'}).map(([key,value]) => `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escapeHtml(value)}">`).join('') + `<script id="page-jsonld" type="application/ld+json">${json(schemas)}</script>`;
    const clean = shell.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi,'')
      .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,'')
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'');
    const boot = `<script id="seo-public-content" type="application/json">${json(content)}</script>`;
    pages[route === '/' ? 'index.html' : `${route.slice(1)}/index.html`] = clean.replace('</head>', metas + '</head>').replace('<div id="root"></div>', `<div id="root"><main style="max-width:72rem;margin:auto;padding:2rem;font-family:system-ui;line-height:1.7">${nav}${body}</main></div>${boot}`);
    if (!noindex) urls.push(`<url><loc>${escapeHtml(url)}</loc>${item?.updatedAt ? `<lastmod>${item.updatedAt}</lastmod>` : ''}</url>`);
  };
  const cards = items => items.map(item => `<article style="margin:2rem 0"><h3><a href="${itemPath(item)}">${escapeHtml(item.title)}</a></h3>${image(item)}${paragraphs(item.metadata.shortDescription || item.description.split('\n\n')[0])}${item.type === 'book' ? `<p>Rp ${item.price.toLocaleString('id-ID')}</p>` : ''}<a href="${itemPath(item)}">Baca selengkapnya</a></article>`).join('');
  // Business schema belongs to index.html; reuse its facts instead of duplicating addresses/schedules.
  const business = [...shell.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1])).find(x => x['@type'] === 'LocalBusiness');
  const services = business?.hasOfferCatalog?.itemListElement || [];
  const classes = services.map(offer => offer.itemOffered || offer).map(s => `<section><h3>${escapeHtml(s.name)}</h3>${paragraphs(s.description || '')}</section>`).join('');
  const address = business?.address ? ['streetAddress','addressLocality','addressRegion','postalCode','addressCountry'].map(k => business.address[k]).filter(Boolean).join(', ') : '';
  const contact = `<section id="kontak"><h2>Kontak Nala Art Studio</h2>${address ? `<address>${escapeHtml(address)}</address>` : ''}${business?.telephone ? `<p><a href="tel:${escapeHtml(business.telephone)}">${escapeHtml(business.telephone)}</a></p>` : ''}${business?.openingHours ? `<p>Operasional: ${business.openingHours === 'Mo-Su 00:00-24:00' ? '24 jam. Jadwal kelas mengikuti jadwal masing-masing kelas.' : escapeHtml([business.openingHours].flat().join(', '))}</p>` : ''}${business?.hasMap ? `<p><a href="${escapeHtml(business.hasMap)}">Lokasi Google Maps</a></p>` : ''}</section>`;
  add('/',HOME_TITLE,HOME_DESCRIPTION,`<h1>${escapeHtml(HOME_TITLE)}</h1>${paragraphs(business?.description || HOME_DESCRIPTION)}<section id="buku-best-seller"><h2>${content.books.length} Buku Best Seller</h2>${cards(content.books)}</section><section id="kelas-seni"><h2>Kelas Seni</h2>${classes || paragraphs('Kelas menggambar dan mewarnai untuk anak dan dewasa.')}</section><section><h2>Worksheet & Produk Digital</h2><p>Latihan menggambar dan mewarnai bersama Nala Art Studio.</p><a href="/sketch-purchase">Sketch Premium</a></section><section><h2>Berita Lomba</h2>${cards(content.articles)}</section>${contact}`);
  add('/berita-lomba','Berita Lomba Mewarnai | Nala Art Studio','Informasi dan dokumentasi kegiatan serta lomba mewarnai Nala Art Studio.',`<h1>Berita Lomba Mewarnai Nala</h1>${cards(content.articles) || '<p>Belum ada artikel berita lomba.</p>'}`);
  for (const item of [...content.books,...content.articles]) {
    const videos = item.metadata.videos || [];
    const winners = item.metadata.winners || [];
    const body = `<article><h1>${escapeHtml(item.title)}</h1>${image(item)}${item.metadata.displayDate ? `<p>${escapeHtml(item.metadata.displayDate)}</p>` : ''}${item.metadata.location ? `<p>${escapeHtml(item.metadata.location)}</p>` : ''}${paragraphs(item.description)}${item.type === 'book' ? `<p>Harga: Rp ${item.price.toLocaleString('id-ID')}</p><p>Pemesanan buku tersedia melalui formulir pembelian di halaman ini dengan JavaScript aktif.</p>` : ''}${videos.length ? `<section id="video-buku"><h2>Video Buku</h2><ul>${videos.map(v => `<li><a href="${escapeHtml(v.url)}" rel="noopener noreferrer">${escapeHtml(v.title)}</a></li>`).join('')}</ul></section>` : ''}${winners.length ? `<section><h2>Dokumentasi Pemenang</h2><ul>${winners.map(w => `<li>${escapeHtml(w.position)} — ${escapeHtml(w.name)}</li>`).join('')}</ul></section>` : ''}</article>${contact}`;
    add(itemPath(item),`${item.title} | Nala Art Studio`,(item.metadata.shortDescription || item.description).replace(/\s+/g,' ').slice(0,155),body,{item});
  }
  for (const [route,title,description,noindex] of fixedPages) add(route,`${title} | Nala Art Studio`,description,`<h1>${escapeHtml(title)}</h1>${paragraphs(description)}<p>Aktifkan JavaScript untuk menggunakan formulir dan fitur halaman ini.</p>`,{noindex});
  return {pages,content,sitemap:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`};
}
