-- Supports the public site's published-post list, ordered newest first.
CREATE INDEX posts_published_by_date
ON posts (status, deleted, published DESC);
