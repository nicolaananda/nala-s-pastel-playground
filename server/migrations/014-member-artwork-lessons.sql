BEGIN;
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS lesson_id BIGINT REFERENCES member_lessons(id) ON DELETE SET NULL;
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS feedback_read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS member_artworks_lesson_idx ON member_artworks(lesson_id);
COMMIT;
