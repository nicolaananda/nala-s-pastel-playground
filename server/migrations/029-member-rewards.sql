BEGIN;
CREATE TABLE member_rewards (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  image_url text CHECK (image_url IS NULL OR (length(image_url) <= 2048 AND image_url ~ '^https://')),
  point_cost integer NOT NULL CHECK (point_cost > 0),
  stock integer NOT NULL CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE member_reward_redemptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id bigint NOT NULL REFERENCES member_accounts(id),
  reward_id bigint NOT NULL REFERENCES member_rewards(id),
  reward_name text NOT NULL,
  point_cost integer NOT NULL CHECK (point_cost > 0),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 8 AND 100),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','preparing','fulfilled','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id,idempotency_key)
);
CREATE INDEX member_reward_redemptions_member_idx ON member_reward_redemptions(member_id,created_at DESC,id DESC);
CREATE TABLE member_reward_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('reward','redemption')),
  entity_id bigint NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE member_point_ledger DROP CONSTRAINT member_point_ledger_kind_check;
ALTER TABLE member_point_ledger ADD CONSTRAINT member_point_ledger_kind_check CHECK (kind IN ('video_purchase','first_submission','purchase_reversal','manual','redemption','redemption_refund'));
ALTER TABLE member_point_ledger DROP CONSTRAINT member_point_ledger_source_type_check;
ALTER TABLE member_point_ledger ADD CONSTRAINT member_point_ledger_source_type_check CHECK (source_type IN ('member_order','member_artwork','admin_adjustment','redemption'));
CREATE UNIQUE INDEX member_point_ledger_redemption_debit_once ON member_point_ledger(source_id) WHERE kind='redemption' AND source_type='redemption';
CREATE UNIQUE INDEX member_point_ledger_redemption_refund_once ON member_point_ledger(source_id) WHERE kind='redemption_refund' AND source_type='redemption';
CREATE FUNCTION member_point_ledger_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'member_point_ledger is append-only'; END $$;
CREATE TRIGGER member_point_ledger_no_update_delete BEFORE UPDATE OR DELETE ON member_point_ledger FOR EACH ROW EXECUTE FUNCTION member_point_ledger_append_only();
COMMIT;
