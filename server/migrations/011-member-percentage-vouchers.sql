BEGIN;
ALTER TABLE member_vouchers ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 100 CHECK (discount_percent BETWEEN 1 AND 100);
ALTER TABLE member_orders ADD COLUMN original_amount INTEGER CHECK (original_amount >= 0);
ALTER TABLE member_orders ADD COLUMN voucher_id BIGINT REFERENCES member_vouchers(id) ON DELETE RESTRICT;
ALTER TABLE member_orders ADD CONSTRAINT member_orders_discount_amount CHECK (original_amount IS NULL OR original_amount >= amount);
CREATE UNIQUE INDEX member_orders_voucher_member_unique ON member_orders(voucher_id,member_id) WHERE voucher_id IS NOT NULL AND status IN ('pending','paid');
COMMIT;
