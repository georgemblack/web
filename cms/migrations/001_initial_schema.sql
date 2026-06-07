CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    published TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    gallery INTEGER NOT NULL DEFAULT 0,
    external_link TEXT,
    content TEXT,
    content_pt TEXT,
    content_html TEXT NOT NULL,
    preview_html TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    portable_text INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE files (
    key TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    year INTEGER NOT NULL,
    optimized INTEGER NOT NULL DEFAULT 0
);
