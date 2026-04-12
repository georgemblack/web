import { WorkerEntrypoint } from "cloudflare:workers";

import {
  render,
  renderPreview,
  renderPortableText,
  renderPortableTextPreview,
} from "./transform";
import {
  ContentBlock,
  FileType,
  WebDbFile,
  Post,
  PostListItem,
  PostStatus,
  RenderedPost,
  CreatePostInput,
  UpdatePostInput,
  createPostInputSchema,
  updatePostInputSchema,
} from "./types";

export type {
  ContentBlock,
  FileType,
  WebDbFile,
  Post,
  PostListItem,
  RenderedPost,
  CreatePostInput,
  UpdatePostInput,
};

export interface ListPostsFilters {
  hidden?: boolean;
  state?: PostStatus;
}

export default class WebDb extends WorkerEntrypoint<Env> {
  async fetch() {
    return new Response(null, { status: 404 });
  }

  async getPost(id: string): Promise<Post | null> {
    const row = await this.env.WEB_DB.prepare(
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

  async getRenderedPost(id: string): Promise<RenderedPost | null> {
    const row = await this.env.WEB_DB.prepare(
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

  async listPosts(filters?: ListPostsFilters): Promise<PostListItem[]> {
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

    const result = await this.env.WEB_DB.prepare(query)
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

  async createPost(input: CreatePostInput): Promise<Post> {
    const validated = createPostInputSchema.parse(input);

    const id = crypto.randomUUID();
    const contentHtml = validated.portable_text
      ? renderPortableText(validated.content)
      : render(validated.content as ContentBlock[]);
    const previewHtml = validated.portable_text
      ? renderPortableTextPreview(validated.content)
      : renderPreview(validated.content as ContentBlock[]);

    await this.env.WEB_DB.prepare(
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

  async updatePost(input: UpdatePostInput): Promise<Post | null> {
    const validated = updatePostInputSchema.parse(input);

    const existing = await this.getPost(validated.id);
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

    await this.env.WEB_DB.prepare(
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

  async deletePost(id: string): Promise<boolean> {
    await this.env.WEB_DB.prepare("UPDATE posts SET deleted = 1 WHERE id = ?")
      .bind(id)
      .run();
    return true;
  }

  async listFiles(year: number): Promise<WebDbFile[]> {
    const result = await this.env.WEB_DB.prepare(
      "SELECT key, type, year, optimized FROM files WHERE year = ? ORDER BY key",
    )
      .bind(year)
      .all<{ key: string; type: FileType; year: number; optimized: number }>();
    return result.results.map((row) => ({
      ...row,
      optimized: row.optimized === 1,
    }));
  }

  async getFile(key: string): Promise<WebDbFile | null> {
    const row = await this.env.WEB_DB.prepare(
      "SELECT key, type, year, optimized FROM files WHERE key = ?",
    )
      .bind(key)
      .first<{
        key: string;
        type: FileType;
        year: number;
        optimized: number;
      }>();
    if (!row) return null;
    return { ...row, optimized: row.optimized === 1 };
  }

  async createFile(
    key: string,
    type: FileType,
    year: number,
    optimized: boolean,
  ): Promise<WebDbFile> {
    await this.env.WEB_DB.prepare(
      "INSERT INTO files (key, type, year, optimized) VALUES (?, ?, ?, ?)",
    )
      .bind(key, type, year, optimized ? 1 : 0)
      .run();
    return { key, type, year, optimized };
  }

  async updateFileOptimized(key: string, optimized: boolean): Promise<boolean> {
    await this.env.WEB_DB.prepare(
      "UPDATE files SET optimized = ? WHERE key = ?",
    )
      .bind(optimized ? 1 : 0, key)
      .run();
    return true;
  }

  async deleteFile(key: string): Promise<boolean> {
    await this.env.WEB_DB.prepare("DELETE FROM files WHERE key = ?")
      .bind(key)
      .run();
    return true;
  }
}
