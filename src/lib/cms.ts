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

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
};

export const fetchPublicContent = async (type: ContentType) => {
  const data = await requestJson<{ items: ContentItem[] }>(`/api/content/${type}`);
  return data.items;
};

export const fetchPublicContentItem = async (type: ContentType, slug: string) => {
  const data = await requestJson<{ item: ContentItem }>(`/api/content/${type}/${slug}`);
  return data.item;
};

export const adminApi = {
  login: (email: string, password: string) => requestJson<{ admin: { email: string } }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  logout: () => requestJson<{ success: true }>("/api/admin/logout", { method: "POST" }),
  me: () => requestJson<{ admin: { email: string } }>("/api/admin/me"),
  listContent: (type?: string) => requestJson<{ items: ContentItem[] }>(`/api/admin/content${type ? `?type=${type}` : ""}`),
  saveContent: (item: ContentItem) => requestJson<{ item: ContentItem }>(item.id ? `/api/admin/content/${item.id}` : "/api/admin/content", {
    method: item.id ? "PUT" : "POST",
    body: JSON.stringify(item),
  }),
  archiveContent: (id: number) => requestJson<{ item: ContentItem }>(`/api/admin/content/${id}`, { method: "DELETE" }),
  transactions: () => requestJson<{ transactions: AccessRecord[]; count: number }>("/api/admin/transactions"),
  revokeCode: (code: string, reason: string) => requestJson<{ record: AccessRecord }>(`/api/admin/access-codes/${code}/revoke`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }),
  restoreCode: (code: string) => requestJson<{ record: AccessRecord }>(`/api/admin/access-codes/${code}/restore`, { method: "POST" }),
  generateCode: (orderId: string) => requestJson<{ code: string }>(`/api/transaction/${orderId}/generate-code`, { method: "POST", body: JSON.stringify({}) }),
  auditLogs: () => requestJson<{ logs: Array<Record<string, unknown>> }>("/api/admin/audit-logs"),
  registerUpload: (url: string, title: string, type: string) => requestJson<{ upload: { url: string; title: string; type: string } }>("/api/admin/uploads", {
    method: "POST",
    body: JSON.stringify({ url, title, type }),
  }),
};
