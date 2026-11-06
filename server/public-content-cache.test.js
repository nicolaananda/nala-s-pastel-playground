import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { publicContentCache, PUBLIC_CONTENT_CACHE_CONTROL } from './public-content-cache.js';

const app = express();
app.get('/api/content/:type/:slug?', publicContentCache, (req, res) => {
  if (req.params.slug === 'missing') return res.status(404).json({ message: 'missing' });
  res.json({ type: req.params.type, slug: req.params.slug || null });
});
const server = app.listen(0);

try {
  const base = `http://127.0.0.1:${server.address().port}`;
  const first = await fetch(`${base}/api/content/book/example`);
  const etag = first.headers.get('etag');
  assert.equal(first.headers.get('cache-control'), PUBLIC_CONTENT_CACHE_CONTROL);
  assert.ok(etag);

  const conditional = await new Promise((resolve, reject) => {
    http.get(`${base}/api/content/book/example`, { headers: { 'If-None-Match': etag } }, resolve).on('error', reject);
  });
  assert.equal(conditional.statusCode, 304);
  assert.equal(conditional.headers['cache-control'], PUBLIC_CONTENT_CACHE_CONTROL);

  for (const url of ['/api/content/article', '/api/content/competition', '/api/content/book/missing']) {
    const response = await fetch(base + url);
    assert.equal(response.headers.get('cache-control'), url === '/api/content/article' ? PUBLIC_CONTENT_CACHE_CONTROL : null);
  }
} finally {
  server.close();
}