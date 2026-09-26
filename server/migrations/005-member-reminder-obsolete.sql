BEGIN;
ALTER TABLE member_reminder_outbox DROP CONSTRAINT member_reminder_outbox_status_check;
ALTER TABLE member_reminder_outbox ADD CONSTRAINT member_reminder_outbox_status_check CHECK (status IN ('pending','sending','sent','obsolete'));
COMMIT;