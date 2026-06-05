import {
  render,
  renderPreview,
  renderPortableText,
  renderPortableTextPreview,
} from "./transform";
import {
  ContentBlock,
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
  format?: "legacy" | "pt",
): Promise<Post | null> {
  const row = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, portable_text, content, content_pt FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<
      Omit<Post, "content" | "hidden" | "gallery" | "portable_text"> & {
        content: string | null;
        content_pt: string | null;
        hidden: number;
        gallery: number;
        portable_text: number;
      }
    >();

  if (!row) {
    return null;
  }

  const isPortableText = row.portable_text === 1;
  const useContentPt =
    format === "pt" || (format === undefined && isPortableText);
  const rawContent = useContentPt
    ? (row.content_pt ?? "[]")
    : (row.content ?? "[]");

  return {
    id: row.id,
    title: row.title,
    published: row.published,
    slug: row.slug,
    status: row.status,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    external_link: row.external_link,
    portable_text: isPortableText,
    content: JSON.parse(rawContent),
  };
}

export async function getRenderedPost(
  db: D1Database,
  id: string,
): Promise<RenderedPost | null> {
  const row = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, portable_text, content, content_pt, content_html, preview_html FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<{
      id: string;
      title: string;
      published: string;
      slug: string;
      status: PostStatus;
      hidden: number;
      gallery: number;
      external_link: string | null;
      portable_text: number;
      content: string | null;
      content_pt: string | null;
      content_html: string;
      preview_html: string | null;
    }>();

  if (!row) {
    return null;
  }

  const isPortableText = row.portable_text === 1;
  let images: RenderedPostImage[] = [];

  if (isPortableText) {
    const blocks = JSON.parse(row.content_pt ?? "[]") as Array<{
      _type?: string;
      key?: string;
      alt?: string;
    }>;
    images = blocks
      .filter((block) => block._type === "image" && block.key)
      .map((block) => ({
        src: `/files/${block.key}`,
        alt: block.alt ?? "",
      }));
  } else {
    const blocks = JSON.parse(row.content ?? "[]") as ContentBlock[];
    images = blocks
      .filter(
        (block): block is ContentBlock & { type: "image" } =>
          block.type === "image",
      )
      .map((block) => ({ src: `/files/${block.key}`, alt: block.alt }));
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
    portable_text: isPortableText,
    content_html: row.content_html,
    preview_html: row.preview_html,
    images,
  };
}

export async function listPosts(
  db: D1Database,
  filters?: ListPostsFilters,
): Promise<PostListItem[]> {
  let query =
    "SELECT id, title, published, status, hidden, gallery, portable_text FROM posts WHERE deleted = 0";
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
      Omit<PostListItem, "hidden" | "gallery" | "portable_text"> & {
        hidden: number;
        gallery: number;
        portable_text: number;
      }
    >();
  return result.results.map((row) => ({
    ...row,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    portable_text: row.portable_text === 1,
  }));
}

export async function createPost(
  db: D1Database,
  input: CreatePostInput,
): Promise<Post> {
  const validated = createPostInputSchema.parse(input);

  const id = crypto.randomUUID();
  const contentHtml = validated.portable_text
    ? renderPortableText(validated.content)
    : render(validated.content as ContentBlock[]);
  const previewHtml = validated.portable_text
    ? renderPortableTextPreview(validated.content)
    : renderPreview(validated.content as ContentBlock[]);

  const serializedContent = JSON.stringify(validated.content);
  await db
    .prepare(
      "INSERT INTO posts (id, title, published, slug, status, hidden, gallery, external_link, portable_text, content, content_pt, content_html, preview_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      validated.portable_text ? 1 : 0,
      validated.portable_text ? null : serializedContent,
      validated.portable_text ? serializedContent : null,
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
    portable_text: validated.portable_text,
    content: validated.content,
  };
}

export async function updatePost(
  db: D1Database,
  input: UpdatePostInput,
): Promise<Post | null> {
  const validated = updatePostInputSchema.parse(input);

  const existing = await db
    .prepare(
      "SELECT portable_text, content_html, preview_html FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(validated.id)
    .first<{
      portable_text: number;
      content_html: string;
      preview_html: string | null;
    }>();
  if (!existing) {
    return null;
  }

  const existingFlag = existing.portable_text === 1;
  const savingPt = validated.portable_text;
  const writingToActiveColumn = savingPt === existingFlag;

  const serializedContent = JSON.stringify(validated.content);

  const contentHtml = writingToActiveColumn
    ? savingPt
      ? renderPortableText(validated.content)
      : render(validated.content as ContentBlock[])
    : existing.content_html;
  const previewHtml = writingToActiveColumn
    ? savingPt
      ? renderPortableTextPreview(validated.content)
      : renderPreview(validated.content as ContentBlock[])
    : existing.preview_html;

  const contentColumn = savingPt ? "content_pt" : "content";
  await db
    .prepare(
      `UPDATE posts SET title = ?, published = ?, slug = ?, status = ?, hidden = ?, gallery = ?, external_link = ?, ${contentColumn} = ?, content_html = ?, preview_html = ? WHERE id = ?`,
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
    portable_text: existingFlag,
    content: validated.content,
  };
}

export async function setPortableText(
  db: D1Database,
  id: string,
  portableText: boolean,
): Promise<{ status: PostStatus } | null> {
  const row = await db
    .prepare(
      "SELECT status, content, content_pt FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<{
      status: PostStatus;
      content: string | null;
      content_pt: string | null;
    }>();
  if (!row) {
    return null;
  }

  const rawContent = portableText
    ? (row.content_pt ?? "[]")
    : (row.content ?? "[]");
  const parsed = JSON.parse(rawContent);
  const contentHtml = portableText
    ? renderPortableText(parsed)
    : render(parsed as ContentBlock[]);
  const previewHtml = portableText
    ? renderPortableTextPreview(parsed)
    : renderPreview(parsed as ContentBlock[]);

  await db
    .prepare(
      "UPDATE posts SET portable_text = ?, content_html = ?, preview_html = ? WHERE id = ?",
    )
    .bind(portableText ? 1 : 0, contentHtml, previewHtml, id)
    .run();

  return { status: row.status };
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
