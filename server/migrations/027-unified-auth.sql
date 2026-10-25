CREATE TABLE IF NOT EXISTS auth_login_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts > 0),
  window_expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_login_limits_expiry_idx ON auth_login_limits(window_expires_at);
