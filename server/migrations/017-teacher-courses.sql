CREATE TABLE IF NOT EXISTS member_teacher_courses (
 email text NOT NULL CHECK (email = lower(email) AND char_length(email) BETWEEN 3 AND 254),
 course_id bigint NOT NULL REFERENCES member_courses(id) ON DELETE CASCADE,
 assigned_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (email, course_id)
);
