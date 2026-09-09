export type BookVideo = { url: string; title: string };
export const MAX_BOOK_VIDEOS: number;
export const MAX_VIDEO_TITLE: number;
export const MAX_VIDEO_URL: number;
export class VideoValidationError extends Error {}
export function parseYouTubeUrl(value: unknown): { url: string; videoId: string; isShort: boolean };
export function normalizeBookVideos(value: unknown): BookVideo[];
export function normalizeVideoMetadata(value: unknown): Record<string, unknown>;
export function getBookVideos(value: unknown): BookVideo[];
