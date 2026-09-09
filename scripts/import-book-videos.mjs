// Run from repository root: node scripts/import-book-videos.mjs [--apply]
// ponytail: one-time curated import; subsequent video edits belong in the CMS.
import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { normalizeBookVideos } from '../shared/book-videos.js';

const { books } = JSON.parse(await fs.readFile(new URL('./data/book-videos.json', import.meta.url), 'utf8'));
const apply = process.argv.includes('--apply');
for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) assert(process.env[key], `${key} required`);
assert.notEqual(process.env.DB_DISABLED, 'true', 'Persistent database required');
const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();
try {
  await client.query('BEGIN');
  const before = [];
  const pending = [];
  for (const book of books) {
    const { rows } = await client.query("SELECT * FROM content_items WHERE type='book' AND slug=$1 FOR UPDATE", [book.slug]);
    assert.equal(rows.length, 1, `Missing or ambiguous book: ${book.slug}`);
    const row = rows[0];
    const videos = normalizeBookVideos(book.videos);
    before.push(row);
    if (Object.hasOwn(row.metadata || {}, 'videos')) {
      console.log(`SKIP existing CMS videos: ${book.slug}`);
      continue;
    }
    pending.push({ id: row.id, slug: book.slug, videos });
    console.log(`${apply ? 'IMPORT' : 'PREVIEW'} ${row.id} ${row.title}: ${videos.length} videos`);
  }
  if (apply && pending.length) {
    const backup = `/root/.hermes/cache/documents/nala-books-before-videos-${Date.now()}.json`;
    await fs.writeFile(backup, JSON.stringify(before, null, 2), { mode: 0o600, flag: 'wx' });
    console.log(`Backup: ${backup}`);
    for (const book of pending) {
      const result = await client.query("UPDATE content_items SET metadata=COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('videos',$1::jsonb), updated_at=NOW() WHERE id=$2 AND NOT (COALESCE(metadata,'{}'::jsonb) ? 'videos') RETURNING metadata", [JSON.stringify(book.videos), book.id]);
      assert.equal(result.rowCount, 1);
      assert.deepEqual(result.rows[0].metadata.videos, book.videos);
    }
  }
  await client.query(apply ? 'COMMIT' : 'ROLLBACK');
  console.log(apply ? 'Import committed; existing CMS values preserved.' : 'Preview only; no changes. Add --apply to import.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
