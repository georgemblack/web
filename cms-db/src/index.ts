import { WorkerEntrypoint } from "cloudflare:workers";
import {
  ContentBlock,
  Post,
  PostListItem,
  PostStatus,
  RenderedPost,
  CreatePostInput,
  UpdatePostInput,
  createPostInputSchema,
  updatePostInputSchema,
} from "./types";
import { render, renderPreview } from "./transform";

export type {
  ContentBlock,
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

export default class CmsDb extends WorkerEntrypoint<Env> {
  async fetch() {
    return new Response(null, { status: 404 });
  }

  async getPost(id: string): Promise<Post | null> {
    const row = await this.env.WEB_DB.prepare(
      "SELECT id, title, published, updated, slug, status, hidden, gallery, external_link, content FROM posts WHERE id = ? AND deleted = 0",
    )
      .bind(id)
      .first<
        Omit<Post, "content" | "hidden" | "gallery"> & {
          content: string;
          hidden: number;
          gallery: number;
        }
      >();

    if (!row) {
      return null;
    }

    return {
      ...row,
      hidden: row.hidden === 1,
      gallery: row.gallery === 1,
      content: JSON.parse(row.content) as ContentBlock[],
    };
  }

  async getRenderedPost(id: string): Promise<RenderedPost | null> {
    const row = await this.env.WEB_DB.prepare(
      "SELECT id, title, published, updated, slug, status, hidden, gallery, external_link, content, content_html, preview_html FROM posts WHERE id = ? AND deleted = 0",
    )
      .bind(id)
      .first<{
        id: string;
        title: string;
        published: string;
        updated: string;
        slug: string;
        status: PostStatus;
        hidden: number;
        gallery: number;
        external_link: string | null;
        content: string;
        content_html: string;
        preview_html: string | null;
      }>();

    if (!row) {
      return null;
    }

    const blocks = JSON.parse(row.content) as ContentBlock[];
    const images = blocks
      .filter(
        (block): block is ContentBlock & { type: "image" } =>
          block.type === "image",
      )
      .map((block) => block.url);

    return {
      id: row.id,
      title: row.title,
      published: row.published,
      updated: row.updated,
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

  async listPosts(filters?: ListPostsFilters): Promise<PostListItem[]> {
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

    const result = await this.env.WEB_DB.prepare(query)
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

  async createPost(input: CreatePostInput): Promise<Post> {
    const validated = createPostInputSchema.parse(input);

    const id = crypto.randomUUID();
    const contentHtml = render(validated.content);
    const previewHtml = renderPreview(validated.content);

    await this.env.WEB_DB.prepare(
      "INSERT INTO posts (id, title, published, updated, slug, status, hidden, gallery, external_link, content, content_html, preview_html) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        validated.title,
        validated.published,
        validated.updated,
        validated.slug,
        validated.status,
        validated.hidden ? 1 : 0,
        validated.gallery ? 1 : 0,
        validated.external_link,
        JSON.stringify(validated.content),
        contentHtml,
        previewHtml,
      )
      .run();

    return {
      id,
      title: validated.title,
      published: validated.published,
      updated: validated.updated,
      slug: validated.slug,
      status: validated.status,
      hidden: validated.hidden,
      gallery: validated.gallery,
      external_link: validated.external_link,
      content: validated.content,
    };
  }

  async updatePost(input: UpdatePostInput): Promise<Post | null> {
    const validated = updatePostInputSchema.parse(input);

    const existing = await this.getPost(validated.id);
    if (!existing) {
      return null;
    }

    const updated = new Date().toISOString();
    const contentHtml = render(validated.content);
    const previewHtml = renderPreview(validated.content);

    const newPost: Post = {
      id: validated.id,
      title: validated.title,
      published: validated.published,
      updated,
      slug: validated.slug,
      status: validated.status,
      hidden: validated.hidden,
      gallery: validated.gallery,
      external_link: validated.external_link,
      content: validated.content,
    };

    await this.env.WEB_DB.prepare(
      "UPDATE posts SET title = ?, published = ?, updated = ?, slug = ?, status = ?, hidden = ?, gallery = ?, external_link = ?, content = ?, content_html = ?, preview_html = ? WHERE id = ?",
    )
      .bind(
        newPost.title,
        newPost.published,
        newPost.updated,
        newPost.slug,
        newPost.status,
        newPost.hidden ? 1 : 0,
        newPost.gallery ? 1 : 0,
        newPost.external_link,
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
}
