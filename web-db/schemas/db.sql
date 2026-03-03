CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    published TEXT NOT NULL,
    updated TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    gallery INTEGER NOT NULL DEFAULT 0,
    external_link TEXT,
    content TEXT NOT NULL,
    content_html TEXT NOT NULL,
    preview_html TEXT,
    deleted INTEGER NOT NULL DEFAULT 0
);
