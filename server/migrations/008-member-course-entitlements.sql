BEGIN;
ALTER TABLE member_plans ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'legacy_all' CHECK (access_mode IN ('legacy_all','selected'));
CREATE TABLE member_plan_courses (
  plan_id BIGINT NOT NULL REFERENCES member_plans(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES member_courses(id) ON DELETE RESTRICT,
  PRIMARY KEY(plan_id,course_id)
);
ALTER TABLE member_orders ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'legacy_all' CHECK (access_mode IN ('legacy_all','selected'));
CREATE TABLE member_order_courses (
  order_id BIGINT NOT NULL REFERENCES member_orders(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES member_courses(id) ON DELETE RESTRICT,
  PRIMARY KEY(order_id,course_id)
);
CREATE TABLE member_course_grants (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES member_courses(id) ON DELETE RESTRICT,
  source_order_id BIGINT NOT NULL REFERENCES member_orders(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_order_id,course_id),
  CHECK(expires_at>starts_at)
);
CREATE INDEX member_course_grants_active ON member_course_grants(member_id,course_id,expires_at);
CREATE FUNCTION member_order_course_snapshot_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'order course snapshots are immutable'; END $$;
CREATE TRIGGER member_order_course_snapshot_immutable BEFORE UPDATE OR DELETE ON member_order_courses FOR EACH ROW EXECUTE FUNCTION member_order_course_snapshot_immutable();

-- Bounded draft mapping. Existing plans remain legacy_all. Only exact package names are mapped,
-- only when every exact course slug exists; no status is changed and reruns are harmless.
WITH mapping(plan_name,course_slug) AS (VALUES
 ('Paket A — Bulanan','contoh-menggambar-dasar'),
 ('Paket B — 3 Bulan','contoh-menggambar-dasar'),('Paket B — 3 Bulan','contoh-mewarnai-crayon'),
 ('Paket C — 6 Bulan','contoh-menggambar-dasar'),('Paket C — 6 Bulan','contoh-mewarnai-crayon'),('Paket C — 6 Bulan','contoh-cat-air-pemula')
), expected(plan_name,n) AS (VALUES ('Paket A — Bulanan',1),('Paket B — 3 Bulan',2),('Paket C — 6 Bulan',3)), eligible AS (
 SELECT p.id,m.plan_name FROM member_plans p JOIN mapping m ON m.plan_name=p.name JOIN member_courses c ON c.slug=m.course_slug
 WHERE p.status='archived'
 GROUP BY p.id,m.plan_name HAVING count(*)=(SELECT n FROM expected e WHERE e.plan_name=m.plan_name)
), inserted AS (
 INSERT INTO member_plan_courses(plan_id,course_id)
 SELECT e.id,c.id FROM eligible e JOIN mapping m ON m.plan_name=e.plan_name JOIN member_courses c ON c.slug=m.course_slug
 ON CONFLICT DO NOTHING RETURNING plan_id
)
UPDATE member_plans p SET access_mode='selected',updated_at=now() WHERE p.id IN (SELECT plan_id FROM inserted);
COMMIT;
