CREATE TABLE IF NOT EXISTS member_announcements(id bigserial PRIMARY KEY,course_id bigint REFERENCES member_courses(id) ON DELETE CASCADE,title text NOT NULL,body text NOT NULL,published_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz,created_by text NOT NULL);
CREATE TABLE IF NOT EXISTS member_notification_deliveries(id bigserial PRIMARY KEY,member_id bigint NOT NULL REFERENCES member_accounts(id) ON DELETE CASCADE,kind text NOT NULL,source_id text NOT NULL,title text NOT NULL,body text NOT NULL DEFAULT '',href text NOT NULL,read_at timestamptz,email_status text NOT NULL DEFAULT 'disabled' CHECK(email_status IN('disabled','queued','sent','failed')),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(member_id,kind,source_id));
ALTER TABLE member_questions ADD COLUMN IF NOT EXISTS lesson_id bigint REFERENCES member_lessons(id) ON DELETE SET NULL;
ALTER TABLE member_questions ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE member_questions ADD COLUMN IF NOT EXISTS answer_read_at timestamptz;
CREATE INDEX IF NOT EXISTS member_announcement_course ON member_announcements(course_id,published_at);
CREATE INDEX IF NOT EXISTS member_notification_member ON member_notification_deliveries(member_id,read_at,created_at);
