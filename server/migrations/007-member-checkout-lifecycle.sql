BEGIN;
ALTER TABLE member_orders
  ADD COLUMN checkout_expires_at TIMESTAMPTZ,
  ADD COLUMN provider_token TEXT;
CREATE INDEX member_orders_unresolved ON member_orders(member_id, created_at, id) WHERE status='pending';
COMMIT;
