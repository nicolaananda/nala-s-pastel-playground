import { copyFile, mkdir } from 'node:fs/promises';

const competitionRoute = 'dist/lomba/tunjukkan-kreasimu-nala-kiddy-play';
await mkdir(`${competitionRoute}/konfirmasi`, { recursive: true });
await copyFile('dist/index.html', 'dist/lomba/index.html');
await copyFile('dist/index.html', `${competitionRoute}/index.html`);
await copyFile('dist/index.html', `${competitionRoute}/konfirmasi/index.html`);
await copyFile('public/lomba/.htaccess', `${competitionRoute}/.htaccess`);
await copyFile('public/lomba/.htaccess', `${competitionRoute}/konfirmasi/.htaccess`);
