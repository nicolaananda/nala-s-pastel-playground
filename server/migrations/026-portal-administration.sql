BEGIN;
ALTER TABLE member_certificates ADD COLUMN IF NOT EXISTS verification_code text UNIQUE;
UPDATE member_certificates SET verification_code=encode(gen_random_bytes(18),'hex') WHERE verification_code IS NULL;
ALTER TABLE member_certificates ALTER COLUMN verification_code SET NOT NULL;
ALTER TABLE member_certificates ADD COLUMN IF NOT EXISTS artifact_digest text;
ALTER TABLE member_certificates ADD COLUMN IF NOT EXISTS artifact_signature text;


CREATE TABLE IF NOT EXISTS member_bulk_imports(
 id bigserial PRIMARY KEY, idempotency_key text NOT NULL UNIQUE, admin_email text NOT NULL,
 input_hash text NOT NULL, row_count integer NOT NULL, result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS member_webhook_subscriptions(
 id bigserial PRIMARY KEY, url text NOT NULL UNIQUE, secret text NOT NULL,
 events text[] NOT NULL, enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(events <@ ARRAY['enrollment.created','certificate.issued']::text[])
);
CREATE TABLE IF NOT EXISTS member_webhook_deliveries(
 id bigserial PRIMARY KEY, subscription_id bigint NOT NULL REFERENCES member_webhook_subscriptions(id) ON DELETE CASCADE,
 event_id uuid NOT NULL DEFAULT gen_random_uuid(), event_type text NOT NULL, payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK(status IN('queued','retry','sent','failed','disabled')),
 attempts integer NOT NULL DEFAULT 0, next_attempt_at timestamptz NOT NULL DEFAULT now(),
 response_status integer, last_error text, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz,
 UNIQUE(subscription_id,event_id)
);
CREATE INDEX IF NOT EXISTS member_webhook_deliveries_due ON member_webhook_deliveries(next_attempt_at,id) WHERE status IN('queued','retry');
COMMIT;
