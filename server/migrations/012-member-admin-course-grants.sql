BEGIN;
ALTER TABLE member_course_grants DROP CONSTRAINT member_course_grants_one_source;
ALTER TABLE member_course_grants
  ADD COLUMN source_admin_id UUID,
  ADD COLUMN grant_reason TEXT,
  ADD COLUMN revoked_at TIMESTAMPTZ,
  ADD COLUMN revoked_by TEXT,
  ADD COLUMN revoke_reason TEXT,
  ADD CONSTRAINT member_course_grants_one_source CHECK (num_nonnulls(source_order_id,source_voucher_redemption_id,source_admin_id)=1),
  ADD CONSTRAINT member_course_grants_admin_reason CHECK (source_admin_id IS NULL OR char_length(grant_reason) BETWEEN 2 AND 500),
  ADD CONSTRAINT member_course_grants_revoke_fields CHECK ((revoked_at IS NULL AND revoked_by IS NULL AND revoke_reason IS NULL) OR (source_admin_id IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND char_length(revoke_reason) BETWEEN 2 AND 500));
CREATE UNIQUE INDEX member_course_grants_admin_source_unique ON member_course_grants(source_admin_id) WHERE source_admin_id IS NOT NULL;
COMMIT;
