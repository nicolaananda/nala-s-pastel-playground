const EVENTS = new Set(['checkout_opened', 'shipping_failed', 'payment_link_failed', 'payment_redirected', 'settlement_succeeded', 'settlement_failed']);
const REASONS = new Set(['none', 'network', 'provider', 'invalid_response', 'cancelled', 'denied', 'expired']);
const BOOK_SLUGS = new Set([
  'coloring-worksheet-juara-1-lomba-mewarnai-volume-2',
  'coloring-worksheet-juara-1-lomba-mewarnai',
  'lets-coloring-your-anime',
  'tips-trik-juara-1-lomba-mewarnai',
  'juaralomba',
]);

export function sanitizeCheckoutEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (!Object.keys(body).every(key => ['event', 'route', 'bookSlug', 'reason'].includes(key))) return null;
  const event = String(body.event || '');
  const route = String(body.route || '');
  const bookSlug = String(body.bookSlug || '');
  const reason = String(body.reason || 'none');
  if (!EVENTS.has(event) || !REASONS.has(reason)) return null;
  if (route !== '/buku/:slug' || !BOOK_SLUGS.has(bookSlug)) return null;
  return { event, route, bookSlug, reason, timestamp: new Date().toISOString() };
}

export function checkoutSettlementEvent(status) {
  if (status === 'settlement' || status === 'capture') return 'settlement_succeeded';
  if (['cancel', 'deny', 'expire'].includes(status)) return 'settlement_failed';
  return null;
}
