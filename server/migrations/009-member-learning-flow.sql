BEGIN;
ALTER TABLE member_accounts ADD COLUMN learning_level TEXT CHECK (learning_level IN ('beginner','intermediate','advanced'));
ALTER TABLE member_orders ADD COLUMN learning_level TEXT CHECK (learning_level IN ('beginner','intermediate','advanced'));
ALTER TABLE member_courses ADD COLUMN learning_level TEXT NOT NULL DEFAULT 'beginner' CHECK (learning_level IN ('beginner','intermediate','advanced'));
ALTER TABLE member_artworks ADD COLUMN score SMALLINT CHECK (score BETWEEN 0 AND 100);
ALTER TABLE member_artworks ADD COLUMN evaluated_at TIMESTAMPTZ;
COMMIT;
