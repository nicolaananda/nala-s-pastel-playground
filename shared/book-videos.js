export const MAX_BOOK_VIDEOS = 30;
export const MAX_VIDEO_TITLE = 160;
export const MAX_VIDEO_URL = 2048;

export class VideoValidationError extends Error {}

/** Parse only explicit HTTPS YouTube video URLs; never fetch user-supplied URLs. */
export function parseYouTubeUrl(value) {
  const invalid = () => new VideoValidationError('URL harus berupa video YouTube HTTPS yang valid (watch, shorts, youtu.be, embed, atau live).');
  if (typeof value !== 'string' || value.length > MAX_VIDEO_URL) throw invalid();
  const input = value.trim();
  // Check raw authority/path too: URL() silently normalizes ports, backslashes and dot segments.
  const raw = input.match(/^https:\/\/([^/?#]+)(\/[^?#]*)?(?:[?#].*)?$/i);
  const hosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'];
  if (!raw || !hosts.includes(raw[1].toLowerCase()) || /[\s\\\u0000-\u001f\u007f]/.test(input)) throw invalid();
  let parsed;
  try { parsed = new URL(input); } catch { throw invalid(); }
  if (parsed.pathname !== (raw[2] || '/')) throw invalid();
  const host = parsed.hostname;
  let videoId;
  let isShort = false;
  if (host === 'youtu.be') {
    videoId = parsed.pathname.match(/^\/([\w-]{11})\/?$/)?.[1];
  } else if (host.endsWith('youtube-nocookie.com')) {
    videoId = parsed.pathname.match(/^\/embed\/([\w-]{11})\/?$/)?.[1];
  } else if (parsed.pathname === '/watch') {
    const ids = parsed.searchParams.getAll('v');
    if (ids.length === 1) videoId = ids[0];
  } else {
    const match = parsed.pathname.match(/^\/(shorts|embed|live)\/([\w-]{11})\/?$/);
    videoId = match?.[2];
    isShort = match?.[1] === 'shorts';
  }
  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw invalid();
  return { videoId, isShort, url: isShort ? `https://www.youtube.com/shorts/${videoId}` : `https://www.youtube.com/watch?v=${videoId}` };
}

/** Preserve order and first occurrence (including its title and Shorts format). */
export function normalizeBookVideos(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new VideoValidationError('Video buku harus berupa daftar {url, title}. Gunakan [] untuk menghapus semua video.');
  if (value.length > MAX_BOOK_VIDEOS) throw new VideoValidationError(`Video buku maksimal ${MAX_BOOK_VIDEOS} baris.`);
  const seen = new Set();
  const videos = [];
  value.forEach((row, index) => {
    try {
      if (!row || typeof row !== 'object' || Array.isArray(row)) throw new VideoValidationError('Isi URL dan judul video.');
      if (typeof row.title !== 'string' || !row.title.trim() || row.title.length > MAX_VIDEO_TITLE || /[\u0000-\u001f\u007f]/.test(row.title)) {
        throw new VideoValidationError(`Judul wajib diisi, satu baris, maksimal ${MAX_VIDEO_TITLE} karakter.`);
      }
      const parsed = parseYouTubeUrl(row.url);
      if (!seen.has(parsed.videoId)) {
        videos.push({ url: parsed.url, title: row.title.trim() });
        seen.add(parsed.videoId);
      }
    } catch (error) {
      throw new VideoValidationError(`Video ${index + 1}: ${error.message}`);
    }
  });
  return videos;
}

/** Strict on admin writes; retain unrelated metadata rather than silently replacing malformed JSON. */
export function normalizeVideoMetadata(value) {
  let metadata = value === undefined ? {} : value;
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch { throw new VideoValidationError('Metadata JSON tidak valid. Perbaiki sebelum menyimpan.'); }
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new VideoValidationError('Metadata harus berupa objek JSON.');
  return Object.hasOwn(metadata, 'videos') ? { ...metadata, videos: normalizeBookVideos(metadata.videos) } : { ...metadata };
}

/** Legacy/untrusted public content must never crash rendering or inject arbitrary embeds. */
export function getBookVideos(value) {
  try { return normalizeBookVideos(value); } catch { return []; }
}
