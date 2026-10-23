CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 email TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry_idx ON admin_sessions(expires_at);
