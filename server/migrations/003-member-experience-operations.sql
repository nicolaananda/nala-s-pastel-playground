BEGIN;
ALTER TABLE member_accounts ADD COLUMN suspended_at TIMESTAMPTZ;
ALTER TABLE member_accounts ADD COLUMN suspension_reason TEXT;
ALTER TABLE member_accounts ADD COLUMN renewal_emails_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE member_progress (
  member_id BIGINT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES member_lessons(id) ON DELETE CASCADE,
  position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (position_seconds BETWEEN 0 AND 86400),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds BETWEEN 0 AND 86400),
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(member_id, lesson_id),
  CHECK (duration_seconds = 0 OR position_seconds <= duration_seconds)
);
CREATE INDEX member_progress_recent ON member_progress(member_id, updated_at DESC);

CREATE TABLE member_favourites (
  member_id BIGINT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES member_courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(member_id, course_id)
);

CREATE TABLE member_access_ledger (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member_accounts(id),
  source_type TEXT NOT NULL CHECK (source_type IN ('payment','admin_grant','admin_revoke')),
  source_id TEXT NOT NULL,
  days_delta INTEGER NOT NULL CHECK (days_delta <> 0),
  previous_expires_at TIMESTAMPTZ,
  resulting_expires_at TIMESTAMPTZ,
  reason TEXT,
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id)
);
INSERT INTO member_access_ledger(member_id,source_type,source_id,days_delta,previous_expires_at,resulting_expires_at,actor,created_at)
SELECT member_id,'payment',order_id,duration_days,NULL,NULL,'provider',COALESCE(fulfilled_at,paid_at,created_at)
FROM member_orders WHERE status='paid' ON CONFLICT DO NOTHING;

CREATE TABLE member_reminder_outbox (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  reminder_key TEXT NOT NULL CHECK (reminder_key IN ('h3','h1','expired')),
  entitlement_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, reminder_key, entitlement_expires_at)
);
CREATE INDEX member_reminder_claim ON member_reminder_outbox(status, available_at);
COMMIT;
