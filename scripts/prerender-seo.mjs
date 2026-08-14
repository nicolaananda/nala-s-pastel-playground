import fs from "node:fs";
import path from "node:path";

const site = "https://artstudionala.com";
const og = `${site}/og-nala-art-studio.png`;
const pages = [
  ["/", "Nala Art Studio - Kelas Mewarnai, Menggambar & Art Therapy", "Kelas seni untuk anak dan dewasa, buku mewarnai, worksheet gratis, serta panduan menggambar dari Nala Art Studio."],
  ["/buku/tips-trik-juara-1-lomba-mewarnai", "Tips & Trick Juara 1 Lomba Mewarnai | Nala Art Studio", "Buku panduan persiapan lomba mewarnai untuk anak, lengkap dengan teknik, alat, bahan, dan video tutorial."],
  ["/buku/lets-coloring-your-anime", "Let's Coloring Your Anime | Nala Art Studio", "Buku berisi 30 sketsa anime eksklusif dengan tips mewarnai mata, rambut, wajah, dan video tutorial."],
  ["/buku/coloring-worksheet-juara-1-lomba-mewarnai", "Coloring Worksheet Juara 1 Lomba Mewarnai | Nala Art Studio", "37 worksheet sketsa tematik untuk latihan dan persiapan lomba mewarnai, lengkap dengan video tutorial."],
  ["/berita-lomba", "Berita Lomba Mewarnai | Nala Art Studio", "Informasi, dokumentasi, dan pengalaman Nala Art Studio dalam kegiatan serta lomba mewarnai anak."],
  ["/berita-lomba/festival-literasi-belandongan-2025", "Festival Literasi Belandongan 2025 | Nala Art Studio", "Pengalaman Nala Art Studio menjadi juri lomba mewarnai anak di Festival Literasi Belandongan, Tangerang Selatan."],
  ["/grasp-guide-premium", "Panduan Premium Grasp | Nala Art Studio", "Panduan eksklusif penggunaan dan teknik mewarnai dengan Grasp dari Nala Art Studio."],
  ["/grasp-sixty-color-premium", "Panduan Grasp 60 Warna | Nala Art Studio", "Panduan premium nama, nomor, swatch, dan penggunaan Grasp 60 warna."],
  ["/sketch-purchase", "Beli Sketch Premium | Nala Art Studio", "Dapatkan koleksi sketch premium Nala Art Studio untuk latihan menggambar dan mewarnai."],
  ["/sketch-premium", "Akses Sketch Premium | Nala Art Studio", "Halaman akses koleksi sketch premium Nala Art Studio."],
];
const source = fs.readFileSync("dist/index.html", "utf8");
for (const [route, title, description] of pages) {
  const canonical = `${site}${route === "/" ? "/" : route}`;
  let html = source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${og}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${og}" />`);
  if (route !== "/") {
    const output = path.join("dist", route.slice(1), "index.html");
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, html);
  } else fs.writeFileSync("dist/index.html", html);
}
const adminHtml = source
  .replace(/<title>[\s\S]*?<\/title>/, "<title>Admin Nala Art Studio</title>")
  .replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, '<link rel="canonical" href="https://artstudionala.com/admin/login" />');
for (const route of ["admin", "admin/login"]) {
  const output = path.join("dist", route, "index.html");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, adminHtml);
}
console.log(`Prerendered SEO metadata for ${pages.length} public routes and admin noindex`);
