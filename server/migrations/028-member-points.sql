BEGIN;
CREATE TABLE member_point_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id bigint NOT NULL REFERENCES member_accounts(id),
  points integer NOT NULL CHECK (points <> 0 AND points BETWEEN -1000000 AND 1000000),
  kind text NOT NULL CHECK (kind IN ('video_purchase','first_submission','purchase_reversal','manual','redemption')),
  source_type text NOT NULL CHECK (source_type IN ('member_order','member_artwork','admin_adjustment','redemption')),
  source_id text NOT NULL CHECK (length(source_id) BETWEEN 1 AND 200),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 2 AND 500),
  actor text NOT NULL CHECK (length(actor) BETWEEN 1 AND 320),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, source_type, source_id)
);
CREATE INDEX member_point_ledger_member_created_idx ON member_point_ledger(member_id,created_at DESC,id DESC);
CREATE UNIQUE INDEX member_point_ledger_first_submission_once ON member_point_ledger(member_id) WHERE kind='first_submission';

-- Existing paid member orders and each member's earliest artwork are unambiguous in the current schema.
INSERT INTO member_point_ledger(member_id,points,kind,source_type,source_id,reason,actor,created_at)
SELECT member_id,15,'video_purchase','member_order',order_id,'Pembelian video berhasil dibayar','system',COALESCE(paid_at,updated_at,created_at)
FROM member_orders WHERE status='paid'
ON CONFLICT(kind,source_type,source_id) DO NOTHING;
INSERT INTO member_point_ledger(member_id,points,kind,source_type,source_id,reason,actor,created_at)
SELECT member_id,10,'first_submission','member_artwork',id::text,'Pengumpulan karya pertama','system',created_at
FROM (SELECT a.*,row_number() OVER(PARTITION BY member_id ORDER BY created_at,id) AS n FROM member_artworks a) firsts
WHERE n=1 ON CONFLICT DO NOTHING;

CREATE FUNCTION award_paid_order_points() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status='paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    INSERT INTO member_point_ledger(member_id,points,kind,source_type,source_id,reason,actor)
    VALUES(NEW.member_id,15,'video_purchase','member_order',NEW.order_id,'Pembelian video berhasil dibayar','system')
    ON CONFLICT(kind,source_type,source_id) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER member_order_points AFTER UPDATE OF status ON member_orders FOR EACH ROW EXECUTE FUNCTION award_paid_order_points();

CREATE FUNCTION award_first_submission_points() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO member_point_ledger(member_id,points,kind,source_type,source_id,reason,actor)
  SELECT NEW.member_id,10,'first_submission','member_artwork',NEW.id::text,'Pengumpulan karya pertama','system'
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER member_artwork_points AFTER INSERT ON member_artworks FOR EACH ROW EXECUTE FUNCTION award_first_submission_points();
COMMIT;
