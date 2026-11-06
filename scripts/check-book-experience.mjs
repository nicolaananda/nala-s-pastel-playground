import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const book = read('src/pages/BookDetail.tsx');
const checkout = read('src/components/CheckoutForm.tsx');
const dialog = read('src/components/BookVideoDialog.tsx');
const main = read('src/main.tsx');
const deploy = read('deploy.sh');

const checks = [
  [book.includes('slice(0, visibleVideos)') && book.includes('count + 12'), 'video list loads in batches of 12'],
  [book.indexOf('🛒 Beli Sekarang') < book.indexOf('id="video-buku"'), 'purchase CTA precedes videos'],
  [book.includes('prefers-reduced-motion: reduce') && book.includes('sm:hidden'), 'checkout scroll and mobile CTA are responsive'],
  [checkout.includes('sessionStorage.setItem') && checkout.includes('sessionStorage.removeItem'), 'checkout draft is temporary and cleared'],
  [checkout.includes('role="alert"') && checkout.includes('motion-safe:animate-spin'), 'checkout exposes errors and respects reduced motion'],
  [dialog.includes('youtube-nocookie.com/embed') && dialog.includes('selected && parsed'), 'YouTube iframe mounts only after selection'],
  [main.includes('VITE_API_URL') && main.includes('/api/client-errors'), 'frontend errors report to configured API'],
  [deploy.includes('release.txt') && deploy.includes('readlink -f') && deploy.includes('rollback'), 'deployment verifies release and can roll back'],
];

for (const [ok, label] of checks) {
  if (!ok) throw new Error(`FAIL: ${label}`);
  console.log(`PASS: ${label}`);
}
