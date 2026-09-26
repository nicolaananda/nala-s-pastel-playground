BEGIN;
ALTER TABLE member_orders
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archive_reason TEXT,
  ADD COLUMN archived_by TEXT;
CREATE INDEX member_orders_member_active ON member_orders(member_id, created_at DESC) WHERE archived_at IS NULL;
COMMIT;
