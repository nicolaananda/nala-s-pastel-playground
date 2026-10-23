CREATE TABLE IF NOT EXISTS member_lesson_notes (
 member_id BIGINT NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,
 lesson_id BIGINT NOT NULL REFERENCES member_lessons(id) ON DELETE CASCADE,
 note TEXT NOT NULL DEFAULT '' CHECK(char_length(note)<=5000),
 bookmarked BOOLEAN NOT NULL DEFAULT false,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(member_id,lesson_id)
);
