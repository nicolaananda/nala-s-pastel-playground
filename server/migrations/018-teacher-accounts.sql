CREATE TABLE member_teachers (
 email text PRIMARY KEY CHECK(email=lower(email) AND char_length(email) BETWEEN 3 AND 254),
 password_hash text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
