import { z } from "zod";

export type PostStatus = "draft" | "published";

export interface MarkdownBlock {
  type: "markdown";
  text: string; // Markdown content
}

export interface ImageBlock {
  type: "image";
  key: string;
  alt: string;
  caption?: string;
}

export interface VideoBlock {
  type: "video";
  key: string;
  caption?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export interface TextBlock {
  type: "text";
  text: string; // HTML
}

export interface HeadingBlock {
  type: "heading";
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface QuoteBlock {
  type: "quote";
  text: string;
}

export interface CodeBlock {
  type: "code";
  text: string;
}

export interface LineBlock {
  type: "line";
}

export interface BreakBlock {
  type: "break";
}

export type ContentBlock =
  | MarkdownBlock
  | ImageBlock
  | VideoBlock
  | TextBlock
  | HeadingBlock
  | QuoteBlock
  | CodeBlock
  | LineBlock
  | BreakBlock;

/**
 * A post represents represents a post in the database, and is returned by
 * the `/api/posts/$id` endpoint.
 */
export interface Post {
  id: string;
  title: string;
  published: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  portable_text: boolean;
  // Content is ContentBlock[] for regular posts, or Portable Text blocks for PT posts.
  // Typed loosely here to avoid deep type instantiation in TanStack's inference.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
}

/**
 * A rendered post is returned by the `/api/posts/$id/rendered` endpoint,
 * and includes only what is needed to render the front-end.
 */
export interface RenderedPost {
  id: string;
  title: string;
  published: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  portable_text: boolean;
  content_html: string;
  preview_html: string | null;
  images: string[];
}

export interface PostListItem {
  id: string;
  title: string;
  published: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  portable_text: boolean;
}

export interface ListPostsFilters {
  hidden?: boolean;
  state?: PostStatus;
}

export type FileType = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface WebFile {
  key: string;
  type: FileType;
  year: number;
  optimized: boolean;
}

// Zod schemas for DB inputs
const postStatusSchema = z.enum(["draft", "published"]);
const iso8601String = z.iso.datetime();
const slugString = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const urlString = z.string().url().nullable();

export const createPostInputSchema = z.object({
  title: z.string(),
  published: iso8601String,
  slug: slugString,
  status: postStatusSchema,
  hidden: z.boolean(),
  gallery: z.boolean(),
  portable_text: z.boolean(),
  content: z.array(z.any()),
  external_link: urlString,
});

export const updatePostInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  published: iso8601String,
  slug: slugString,
  status: postStatusSchema,
  hidden: z.boolean(),
  gallery: z.boolean(),
  portable_text: z.boolean(),
  content: z.array(z.any()),
  external_link: urlString,
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
