import { copyFile, mkdir } from 'node:fs/promises';

const competitionRoute = 'dist/lomba/tunjukkan-kreasimu-nala-kiddy-play';
const adminRoutes = ['content','competitions','premium-access','uploads','audit'];
await mkdir(`${competitionRoute}/konfirmasi`, { recursive: true });
await copyFile('dist/index.html', 'dist/lomba/index.html');
await copyFile('dist/index.html', `${competitionRoute}/index.html`);
await copyFile('dist/index.html', `${competitionRoute}/konfirmasi/index.html`);
await copyFile('public/lomba/.htaccess', `${competitionRoute}/.htaccess`);
await copyFile('public/lomba/.htaccess', `${competitionRoute}/konfirmasi/.htaccess`);
for (const route of adminRoutes) {
  await mkdir(`dist/admin/${route}`, { recursive: true });
  await copyFile('dist/index.html', `dist/admin/${route}/index.html`);
}
// ponytail: active competition IDs get physical shells because this LiteSpeed host ignores nested SPA rewrites.
await mkdir('dist/admin/competitions/902/participants', { recursive: true });
await copyFile('dist/index.html', 'dist/admin/competitions/902/participants/index.html');
