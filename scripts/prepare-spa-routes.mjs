import { copyFile, mkdir } from 'node:fs/promises';

const competitionRoute = 'dist/lomba/tunjukkan-kreasimu-nala-kiddy-play';
await mkdir(competitionRoute, { recursive: true });
await copyFile('dist/index.html', 'dist/lomba/index.html');
await copyFile('dist/index.html', `${competitionRoute}/index.html`);
// ponytail: confirmation tokens still use the existing /lomba ErrorDocument fallback; add server routing when LiteSpeed config is available.
await copyFile('public/lomba/.htaccess', `${competitionRoute}/.htaccess`);
