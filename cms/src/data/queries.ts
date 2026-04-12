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
  ListPostsFilters,
  Post,
  PostListItem,
  PostStatus,
  RenderedPost,
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
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, portable_text, content FROM posts WHERE id = ? AND deleted = 0",
    )
    .bind(id)
    .first<
      Omit<Post, "content" | "hidden" | "gallery" | "portable_text"> & {
        content: string;
        hidden: number;
        gallery: number;
        portable_text: number;
      }
    >();

  if (!row) {
    return null;
  }

  return {
    ...row,
    hidden: row.hidden === 1,
    gallery: row.gallery === 1,
    portable_text: row.portable_text === 1,
    content: JSON.parse(row.content),
  };
}

export async function getRenderedPost(
  db: D1Database,
  id: string,
): Promise<RenderedPost | null> {
  const row = await db
    .prepare(
      "SELECT id, title, published, slug, status, hidden, gallery, external_link, portable_text, content, content_html, preview_html FROM posts WHERE id = ? AND deleted = 0",
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
      content: string;
      content_html: string;
      preview_html: string | null;
    }>();

  if (!row) {
    return null;
  }

  const isPortableText = row.portable_text === 1;
  let images: string[] = [];

  if (!isPortableText) {
    const blocks = JSON.parse(row.content) as ContentBlock[];
    images = blocks
      .filter(
        (block): block is ContentBlock & { type: "image" } =>
          block.type === "image",
      )
      .map((block) => `/files/${block.key}`);
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

  await db
    .prepare(
      "INSERT INTO posts (id, title, published, slug, status, hidden, gallery, external_link, portable_text, content, content_html, preview_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      JSON.stringify(validated.content),
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

  const existing = await getPost(db, validated.id);
  if (!existing) {
    return null;
  }

  const contentHtml = validated.portable_text
    ? renderPortableText(validated.content)
    : render(validated.content as ContentBlock[]);
  const previewHtml = validated.portable_text
    ? renderPortableTextPreview(validated.content)
    : renderPreview(validated.content as ContentBlock[]);

  const newPost: Post = {
    id: validated.id,
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

  await db
    .prepare(
      "UPDATE posts SET title = ?, published = ?, slug = ?, status = ?, hidden = ?, gallery = ?, external_link = ?, portable_text = ?, content = ?, content_html = ?, preview_html = ? WHERE id = ?",
    )
    .bind(
      newPost.title,
      newPost.published,
      newPost.slug,
      newPost.status,
      newPost.hidden ? 1 : 0,
      newPost.gallery ? 1 : 0,
      newPost.external_link,
      newPost.portable_text ? 1 : 0,
      JSON.stringify(newPost.content),
      contentHtml,
      previewHtml,
      validated.id,
    )
    .run();

  return newPost;
}

export async function deletePost(db: D1Database, id: string): Promise<boolean> {
  await db.prepare("UPDATE posts SET deleted = 1 WHERE id = ?").bind(id).run();
  return true;
}

export async function listFiles(
  db: D1Database,
  year: number,
): Promise<WebFile[]> {
  const result = await db
    .prepare(
      "SELECT key, type, year, optimized FROM files WHERE year = ? ORDER BY key",
    )
    .bind(year)
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
