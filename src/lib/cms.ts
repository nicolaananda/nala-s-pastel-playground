import { publicSeoContent } from '../../shared/seo.js';

export type ContentStatus = "draft" | "published" | "archived";

export type ContentType = "book" | "article" | "grasp_asset" | "premium_product" | "merchandise";

export interface ContentItem {
  id?: number;
  type: ContentType;
  slug: string;
  title: string;
  description: string;
  price?: number | null;
  imageUrl?: string | null;
  fileUrl?: string | null;
  metadata: Record<string, unknown>;
  status: ContentStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: number;
  url: string;
  title: string;
  type: string;
  size: number | null;
  createdAt: string;
  usedBy: Array<{ id: number; title: string; field: "imageUrl" | "fileUrl" }>;
}

export interface AccessRecord {
  transactionId: string;
  orderId: string;
  code: string;
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  savedAt: string;
  source: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

const apiBase = () => import.meta.env.VITE_API_URL || "";

const apiUrl = (path: string) => `${apiBase()}${path}`;

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw Object.assign(new Error(error.message || "Request failed"), {status: response.status});
  }
  return response.json();
};

// Only allowlisted public CMS fields are embedded by prerender. No admin data or downloads.
const bootContent: {books?: ContentItem[]; articles?: ContentItem[]} = (() => {
  try { return JSON.parse(document.getElementById('seo-public-content')?.textContent || '{}'); }
  catch { return {}; }
})();
export const getBootContent = (type: ContentType): ContentItem[] =>
  (type === 'book' ? bootContent.books : type === 'article' ? bootContent.articles : []) || [];
const cleanPublic = (items: ContentItem[], type: ContentType): ContentItem[] => {
  if (type !== 'book' && type !== 'article') return items;
  return publicSeoContent({books:type === 'book' ? items : [], articles:type === 'article' ? items : []})[type === 'book' ? 'books' : 'articles'] as ContentItem[];
};

export const fetchPublicContent = async (type: ContentType) => {
  const data = await requestJson<{ items: ContentItem[] }>(`/api/content/${type}`);
  const items = cleanPublic(data.items, type);
  if (type === 'book') bootContent.books = items;
  if (type === 'article') bootContent.articles = items;
  return items;
};

export const fetchPublicContentItem = async (type: ContentType, slug: string) => {
  const data = await requestJson<{ item: ContentItem }>(`/api/content/${type}/${slug}`);
  return cleanPublic([data.item], type)[0];
};

export const cmsArticleToView = (item: ContentItem) => ({
  id: item.slug, title: item.title, content: item.description,
  date: String(item.metadata?.displayDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '')),
  location: String(item.metadata?.location || ''),
  photos: item.imageUrl ? [{src:item.imageUrl,srcFallback:item.imageUrl,alt:item.title,caption:''}] : [],
  winners: (Array.isArray(item.metadata?.winners) ? item.metadata.winners : []) as Array<{name:string;position:string;photo?:string;photoFallback?:string}>,
  featured: Boolean(item.metadata?.featured), cmsItem: item,
});

export const adminApi = {
  login: (email: string, password: string) => requestJson<{ admin: { email: string } }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  logout: () => requestJson<{ success: true }>("/api/admin/logout", { method: "POST" }),
  me: () => requestJson<{ admin: { email: string } }>("/api/admin/me"),
  listContent: (type?: string) => requestJson<{ items: ContentItem[] }>(`/api/admin/content${type ? `?type=${type}` : ""}`),
  saveContent: (item: ContentItem) => requestJson<{ item: ContentItem; seo?: {ok: boolean; message?: string} }>(item.id ? `/api/admin/content/${item.id}` : "/api/admin/content", {
    method: item.id ? "PUT" : "POST",
    body: JSON.stringify(item),
  }),
  archiveContent: (id: number) => requestJson<{ item: ContentItem; seo?: {ok: boolean; message?: string} }>(`/api/admin/content/${id}`, { method: "DELETE" }),
  transactions: () => requestJson<{ transactions: AccessRecord[]; count: number }>("/api/admin/transactions"),
  revokeCode: (code: string, reason: string) => requestJson<{ record: AccessRecord }>(`/api/admin/access-codes/${code}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }),
  restoreCode: (code: string) => requestJson<{ record: AccessRecord }>(`/api/admin/access-codes/${code}/restore`, { method: "POST" }),
  generateCode: (orderId: string) => requestJson<{ code: string }>(`/api/transaction/${orderId}/generate-code`, { method: "POST", body: JSON.stringify({}) }),
  auditLogs: () => requestJson<{ logs: Array<Record<string, unknown>> }>("/api/admin/audit-logs"),
  media: () => requestJson<{ media: MediaItem[] }>("/api/admin/media"),
  deleteMedia: (id: number) => requestJson<{ success: true }>(`/api/admin/media/${id}`, { method: "DELETE" }),
  registerUpload: (url: string, title: string, type: string) => requestJson<{ upload: { url: string; title: string; type: string } }>("/api/admin/uploads", {
    method: "POST",
    body: JSON.stringify({ url, title, type }),
  }),
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(apiUrl("/api/admin/uploads/file"), {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || "Upload failed");
    }
    return response.json() as Promise<{ upload: { url: string; title: string; type: string } }>;
  },
};
