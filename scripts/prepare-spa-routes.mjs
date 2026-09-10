import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist/lomba', { recursive: true });
await copyFile('dist/index.html', 'dist/lomba/index.html');
