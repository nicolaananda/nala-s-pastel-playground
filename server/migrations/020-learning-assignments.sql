ALTER TABLE member_lessons ADD COLUMN IF NOT EXISTS assignment_prompt text NOT NULL DEFAULT '';
ALTER TABLE member_lessons ADD COLUMN IF NOT EXISTS assignment_rubric jsonb NOT NULL DEFAULT '[]';
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS strengths text NOT NULL DEFAULT '';
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS next_practice text NOT NULL DEFAULT '';
ALTER TABLE member_artworks ADD COLUMN IF NOT EXISTS rubric_scores jsonb NOT NULL DEFAULT '[]';
ALTER TABLE member_artwork_revisions ADD COLUMN IF NOT EXISTS strengths text NOT NULL DEFAULT '';
ALTER TABLE member_artwork_revisions ADD COLUMN IF NOT EXISTS next_practice text NOT NULL DEFAULT '';
ALTER TABLE member_artwork_revisions ADD COLUMN IF NOT EXISTS rubric_scores jsonb NOT NULL DEFAULT '[]';
