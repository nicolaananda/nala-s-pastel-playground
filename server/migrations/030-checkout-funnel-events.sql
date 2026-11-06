CREATE TABLE IF NOT EXISTS checkout_funnel_events (
 id BIGSERIAL PRIMARY KEY,
 event TEXT NOT NULL CHECK (event IN ('checkout_opened','shipping_failed','payment_link_failed','payment_redirected','settlement_succeeded','settlement_failed')),
 route TEXT NOT NULL CHECK (route='/buku/:slug'),
 book_slug TEXT NOT NULL,
 reason TEXT NOT NULL CHECK (reason IN ('none','network','provider','invalid_response','cancelled','denied','expired')),
 occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS checkout_funnel_events_occurred_book_idx ON checkout_funnel_events (occurred_at,book_slug);