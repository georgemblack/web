import { render, renderPreview } from "./transform";
import {
  CreatePostInput,
  FileType,
  ListFilesFilters,
  ListPostsFilters,
  Post,
  PostListItem,
  PostStatus,
  RenderedPost,
  RenderedPostImage,
  UpdatePostInput,
  WebFile,
  createPostInputSchema,
  updatePostInputSchema,
} from "./types";

export async function getPost(
  db: D1Database,
  id: string,
): Promise<Post | null> {
  const row = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, content_pt FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<
      Omit<Post, "content" | "hidden" | "gallery"> & {
        content_pt: string | null;
        hidden: number;
        gallery: number;
      }
    >();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    published: row.published,
    slug: row.slug,
    status: row.status,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    external_link: row.external_link,
    content: JSON.parse(row.content_pt ?? "[]"),
  };
}

// Columns needed to render a post on the front-end.
const RENDERED_COLUMNS =
  "id, title, published, slug, status, hidden, gallery, external_link, content_pt, content_html, preview_html";

interface RenderedPostRow {
  id: string;
  title: string;
  published: string;
  slug: string;
  status: PostStatus;
  hidden: number;
  gallery: number;
  external_link: string | null;
  content_pt: string | null;
  content_html: string;
  preview_html: string | null;
}

function toRenderedPost(row: RenderedPostRow): RenderedPost {
  const blocks = JSON.parse(row.content_pt ?? "[]") as Array<{
    _type?: string;
    key?: string;
    alt?: string;
  }>;
  const images: RenderedPostImage[] = blocks
    .filter((block) => block._type === "image" && block.key)
    .map((block) => ({
      src: `/files/${block.key}`,
      alt: block.alt ?? "",
    }));

  return {
    id: row.id,
    title: row.title,
    published: row.published,
    slug: row.slug,
    status: row.status,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    external_link: row.external_link,
    content_html: row.content_html,
    preview_html: row.preview_html,
    images,
  };
}

export async function getRenderedPost(
  db: D1Database,
  id: string,
): Promise<RenderedPost | null> {
  const row = await db
    .prepare(
      `SELECT ${RENDERED_COLUMNS} FROM posts WHERE id = ? AND deleted = 0`,
    )
    .bind(id)
    .first<RenderedPostRow>();

  return row ? toRenderedPost(row) : null;
}

// Look up a published post by its unique slug. Used by the front-end to render
// an individual post page without needing the post's ID.
export async function getRenderedPostBySlug(
  db: D1Database,
  slug: string,
): Promise<RenderedPost | null> {
  const row = await db
    .prepare(
      `SELECT ${RENDERED_COLUMNS} FROM posts WHERE slug = ? AND status = 'published' AND deleted = 0`,
    )
    .bind(slug)
    .first<RenderedPostRow>();

  return row ? toRenderedPost(row) : null;
}

export async function listPosts(
  db: D1Database,
  filters?: ListPostsFilters,
): Promise<PostListItem[]> {
  let query =
    "SELECT id, title, published, status, hidden, gallery FROM posts WHERE deleted = 0";
  const bindings: (string | number)[] = [];

  if (filters?.hidden !== undefined) {
    query += " AND hidden = ?";
    bindings.push(filters.hidden ? 1 : 0);
  }

  if (filters?.state !== undefined) {
    query += " AND status = ?";
    bindings.push(filters.state);
  }

  query += " ORDER BY published DESC";

  const result = await db
    .prepare(query)
    .bind(...bindings)
    .all<
      Omit<PostListItem, "hidden" | "gallery"> & {
        hidden: number;
        gallery: number;
      }
    >();
  return result.results.map((row) => ({
    ...row,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
  }));
}

export async function createPost(
  db: D1Database,
  input: CreatePostInput,
): Promise<Post> {
  const validated = createPostInputSchema.parse(input);

  const id = crypto.randomUUID();
  const contentHtml = render(validated.content);
  const previewHtml = renderPreview(validated.content);

  const serializedContent = JSON.stringify(validated.content);
  await db
    .prepare(
      "INSERT INTO posts (id, title, published, slug, status, hidden, gallery, external_link, content_pt, content_html, preview_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      validated.title,
      validated.published,
      validated.slug,
      validated.status,
      validated.hidden ? 1 : 0,
      validated.gallery ? 1 : 0,
      validated.external_link,
      serializedContent,
      contentHtml,
      previewHtml,
    )
    .run();

  return {
    id,
    title: validated.title,
    published: validated.published,
    slug: validated.slug,
    status: validated.status,
    hidden: validated.hidden,
    gallery: validated.gallery,
    external_link: validated.external_link,
    content: validated.content,
  };
}

export async function updatePost(
  db: D1Database,
  input: UpdatePostInput,
): Promise<Post | null> {
  const validated = updatePostInputSchema.parse(input);

  const existing = await db
    .prepare("SELECT id FROM posts WHERE id = ? AND deleted = 0")
    .bind(validated.id)
    .first<{ id: string }>();
  if (!existing) {
    return null;
  }

  const serializedContent = JSON.stringify(validated.content);
  const contentHtml = render(validated.content);
  const previewHtml = renderPreview(validated.content);

  await db
    .prepare(
      "UPDATE posts SET title = ?, published = ?, slug = ?, status = ?, hidden = ?, gallery = ?, external_link = ?, content_pt = ?, content_html = ?, preview_html = ? WHERE id = ?",
    )
    .bind(
      validated.title,
      validated.published,
      validated.slug,
      validated.status,
      validated.hidden ? 1 : 0,
      validated.gallery ? 1 : 0,
      validated.external_link,
      serializedContent,
      contentHtml,
      previewHtml,
      validated.id,
    )
    .run();

  return {
    id: validated.id,
    title: validated.title,
    published: validated.published,
    slug: validated.slug,
    status: validated.status,
    hidden: validated.hidden,
    gallery: validated.gallery,
    external_link: validated.external_link,
    content: validated.content,
  };
}

export async function deletePost(db: D1Database, id: string): Promise<boolean> {
  await db.prepare("UPDATE posts SET deleted = 1 WHERE id = ?").bind(id).run();
  return true;
}

export async function listFiles(
  db: D1Database,
  filters: ListFilesFilters,
): Promise<WebFile[]> {
  let query = "SELECT key, type, year, optimized FROM files WHERE year = ?";
  const bindings: (string | number)[] = [filters.year];

  if (filters.type !== undefined) {
    query += " AND type = ?";
    bindings.push(filters.type);
  }

  query += " ORDER BY key";

  const result = await db
    .prepare(query)
    .bind(...bindings)
    .all<{ key: string; type: FileType; year: number; optimized: number }>();
  return result.results.map((row) => ({
    ...row,
    optimized: row.optimized === 1,
  }));
}

export async function createFile(
  db: D1Database,
  key: string,
  type: FileType,
  year: number,
  optimized: boolean,
): Promise<WebFile> {
  await db
    .prepare(
      "INSERT INTO files (key, type, year, optimized) VALUES (?, ?, ?, ?)",
    )
    .bind(key, type, year, optimized ? 1 : 0)
    .run();
  return { key, type, year, optimized };
}

export async function updateFileOptimized(
  db: D1Database,
  key: string,
  optimized: boolean,
): Promise<boolean> {
  await db
    .prepare("UPDATE files SET optimized = ? WHERE key = ?")
    .bind(optimized ? 1 : 0, key)
    .run();
  return true;
}

export async function deleteFile(
  db: D1Database,
  key: string,
): Promise<boolean> {
  await db.prepare("DELETE FROM files WHERE key = ?").bind(key).run();
  return true;
}
