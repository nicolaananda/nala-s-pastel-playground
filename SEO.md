# CMS SEO

`npm run build` builds Vite then generates visible HTML, per-page metadata/schema and sitemap for every published book/article. CMS must be available; failures abort the build rather than publishing fallback content. Override `SEO_CMS_URL` for builds (default `http://localhost:8723`).

Production API `.env`: `SEO_OUTPUT_DIR=/home/artstudionala.com/public_html`. After create/update/archive, the server regenerates snapshots from published CMS data, serializes refreshes and replaces files atomically. Only manifest-tracked generated index files can be removed. API returns `seo.ok`; admin displays a warning if content saved but SEO refresh failed. Last-good pages remain on fetch/validation/render failures. Investigate server logs and rerun a successful CMS save or rebuild to recover.

Deploy a complete `dist` as a new release, atomically switch the public_html symlink, restart `nala-engine` when server code changes, then gracefully reload OpenLiteSpeed when rewrite rules change (`/usr/local/lsws/bin/lswsctrl reload`). Keep `.seo-shell.html`, `.seo-assets.json`, `.seo-manifest.json` in the release; rewrite rules deny public access to dotfiles. Do not copy only index.html. Confirm nonexistent book/article URLs return 404 after reload.

Business contact source is `shared/business.json`; matching LocalBusiness data is in index.html. Address, Maps, phone and 24-hour operation were supplied by the site owner. Classes retain their own schedules; no online/offline modality is inferred. Update both contact JSON and index schema when business facts change.

Tests: `node --test scripts/seo.test.mjs` and `node scripts/test-book-videos.mjs`. Verify public raw HTML without JavaScript (H1, full text, canonical), sitemap URLs/dates, and browser interaction after deployment. No ranking or indexing guarantees. Submit sitemap in Google Search Console separately.
