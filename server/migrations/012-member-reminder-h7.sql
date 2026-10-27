BEGIN;
ALTER TABLE member_reminder_outbox DROP CONSTRAINT member_reminder_outbox_reminder_key_check;
ALTER TABLE member_reminder_outbox ADD CONSTRAINT member_reminder_outbox_reminder_key_check CHECK (reminder_key IN ('h7','h3','h1','expired'));
COMMIT;
