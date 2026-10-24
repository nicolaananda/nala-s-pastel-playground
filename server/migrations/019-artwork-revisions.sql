CREATE TABLE IF NOT EXISTS member_artwork_revisions (
 id bigserial PRIMARY KEY,
 artwork_id bigint NOT NULL REFERENCES member_artworks(id) ON DELETE CASCADE,
 storage_name text NOT NULL,
 feedback text,
 score integer,
 strengths text,
 next_practice text,
 rubric_scores jsonb,
 evaluated_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_artwork_revisions_artwork ON member_artwork_revisions(artwork_id,id);
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0;
