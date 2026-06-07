-- Drop the portable_text column from posts. All posts are now stored as
-- Portable Text in content_pt; the legacy content column is retained.
ALTER TABLE posts DROP COLUMN portable_text;
