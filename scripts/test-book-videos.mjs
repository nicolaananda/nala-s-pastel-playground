import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const moduleUrl = new URL('../shared/book-videos.js', import.meta.url);
assert.ok(existsSync(moduleUrl), 'Shared book video validator must exist');
const { parseYouTubeUrl, normalizeBookVideos, normalizeVideoMetadata, VideoValidationError, MAX_BOOK_VIDEOS, MAX_VIDEO_TITLE, MAX_VIDEO_URL, getBookVideos } = await import(moduleUrl.href);
const id = 'AbCdEf_12-3';
const short = `https://www.youtube.com/shorts/${id}`;
const watch = `https://www.youtube.com/watch?v=${id}`;
for (const [url, canonical, isShort] of [
  [`  ${short}?si=share#x  `, short, true],
  [`https://m.youtube.com/shorts/${id}/`, short, true],
  [`https://youtu.be/${id}?t=42`, watch, false],
  [`https://www.youtube.com/watch?list=ignored&v=${id}&t=3`, watch, false],
  [`https://music.youtube.com/watch?v=${id}`, watch, false],
  [`https://youtube.com/embed/${id}`, watch, false],
  [`https://www.youtube-nocookie.com/embed/${id}`, watch, false],
  [`https://youtube.com/live/${id}`, watch, false],
]) {
  assert.deepEqual(parseYouTubeUrl(url), { url: canonical, videoId: id, isShort });
}
for (const url of [
  '', null, 123, `http://youtube.com/watch?v=${id}`, `javascript:alert(1)`,
  `https://youtube.com.evil.test/watch?v=${id}`, `https://evil.test/?url=${watch}`,
  `https://youtube.com@evil.test/watch?v=${id}`, `https://user@youtube.com/watch?v=${id}`,
  `https://youtube.com:444/watch?v=${id}`, `https://youtube.com:443/watch?v=${id}`,
  `https://youtube.com./watch?v=${id}`, `//youtube.com/watch?v=${id}`,
  `https://you\ntube.com/watch?v=${id}`, `https://youtube.com\\@evil.test/watch?v=${id}`,
  `https://youtube.com/watch?v=bad`, `https://youtube.com/watch?v=${id}&v=${id}`,
  `https://youtube.com/playlist?list=${id}`, `https://youtu.be/${id}/extra`,
  `https://youtube.com/shorts/${id}/extra`, `https://youtube.com/foo/../shorts/${id}`,
  `https://youtube.com/shorts/%41bCdEf_12-3`, 'https://youtu.be/' + 'x'.repeat(MAX_VIDEO_URL),
]) assert.throws(() => parseYouTubeUrl(url), VideoValidationError, String(url));

const rows = [{ url: short + '?si=a', title: ' Utama ' }, { url: watch, title: 'Duplikat' }, { url: 'https://youtu.be/ZyXwVu_98-7', title: 'Kedua' }];
const copy = structuredClone(rows);
assert.deepEqual(normalizeBookVideos(rows), [{ url: short, title: 'Utama' }, { url: 'https://www.youtube.com/watch?v=ZyXwVu_98-7', title: 'Kedua' }]);
assert.deepEqual(rows, copy, 'Normalization must not mutate editor data');
assert.deepEqual(normalizeBookVideos(undefined), []);
assert.deepEqual(normalizeBookVideos([]), []);
for (const videos of [null, {}, '', [null], ['url'], [{ url: short }], [{ url: short, title: '' }], [{ url: short, title: 2 }], [{ url: short, title: 'x'.repeat(MAX_VIDEO_TITLE + 1) }], Array(MAX_BOOK_VIDEOS + 1).fill(rows[0])]) {
  assert.throws(() => normalizeBookVideos(videos), VideoValidationError);
}
assert.throws(() => normalizeBookVideos([rows[0], { url: 'bad', title: 'Salah' }]), /Video 2/);
assert.deepEqual(normalizeVideoMetadata({ gradient: 'pink', nested: { keep: true }, videos: rows }), { gradient: 'pink', nested: { keep: true }, videos: normalizeBookVideos(rows) });
assert.deepEqual(normalizeVideoMetadata('{"custom":true,"videos":[]}'), { custom: true, videos: [] });
assert.deepEqual(normalizeVideoMetadata(undefined), {});
for (const metadata of ['{bad', '[]', 'null', [], null, 1]) assert.throws(() => normalizeVideoMetadata(metadata), VideoValidationError);
assert.deepEqual(getBookVideos([{ url: 'https://evil.test', title: 'Unsafe' }]), []);
assert.deepEqual(getBookVideos(rows), normalizeBookVideos(rows));

// Exercise the actual create/update route handlers without starting the server or touching a database.
const server = readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
const normalizeSource = server.match(/const normalizeContentInput = [\s\S]*?\n\};|const normalizeContentInput = [\s\S]*?\n\}\);/)[0];
const routesSource = server.slice(server.indexOf("app.post('/api/admin/content',"), server.indexOf("app.delete('/api/admin/content/:id',"));
const routes = {};
let writes = 0;
const context = vm.createContext({ normalizeVideoMetadata, VideoValidationError, console, refreshAfterCmsSave: async () => ({ok:true}), requireAdmin: () => {}, app: {
  post: (path, auth, handler) => { routes.post = handler; },
  put: (path, auth, handler) => { routes.put = handler; },
}, db: { createContentItem: async (item) => { writes++; return { ...item, id: 1 }; }, updateContentItem: async (id, item) => { writes++; return { ...item, id }; }, logAdminAction: async () => {} } });
vm.runInContext(normalizeSource + '\n' + routesSource, context);
for (const handler of Object.values(routes)) {
  for (const metadata of [{ videos: [{ url: 'https://evil.test', title: 'Unsafe' }] }, '{broken', { videos: null }]) {
    const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ body: { type: 'book', slug: 'existing', title: 'Buku', metadata }, params: { id: '1' }, admin: { email: 'test' } }, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Video|Metadata/);
  }
}
assert.equal(writes, 0, 'Invalid admin input must never reach DB writes');
for (const handler of Object.values(routes)) {
  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await handler({ body: { type: 'book', slug: 'existing', title: 'Buku', metadata: { videos: rows, other: true } }, params: { id: '1' }, admin: { email: 'test' } }, res);
  assert.ok([200, 201].includes(res.statusCode));
  assert.deepEqual(res.body.item.metadata.videos, normalizeBookVideos(rows));
  assert.equal(res.body.item.metadata.other, true);
}
console.log('Book video parsing, validation, dedup, metadata preservation and admin 400 checks passed.');
