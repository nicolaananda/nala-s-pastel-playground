BEGIN;
CREATE TABLE IF NOT EXISTS member_operational_events (
 id bigserial PRIMARY KEY,
 severity text NOT NULL CHECK(severity IN ('info','warning','error')),
 kind text NOT NULL,
 source text NOT NULL,
 message text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}',
 occurred_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,
 resolved_by text
);
CREATE INDEX IF NOT EXISTS member_operational_events_open ON member_operational_events(severity,occurred_at DESC) WHERE resolved_at IS NULL;
CREATE TABLE IF NOT EXISTS member_backup_status (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 last_success_at timestamptz,
 last_attempt_at timestamptz,
 status text NOT NULL DEFAULT 'unknown' CHECK(status IN ('unknown','running','success','failed')),
 retention_days integer NOT NULL DEFAULT 30 CHECK(retention_days BETWEEN 1 AND 3650),
 retained_from timestamptz,
 location text NOT NULL DEFAULT 'not configured',
 last_error text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO member_backup_status(id) VALUES(true) ON CONFLICT DO NOTHING;
COMMIT;
