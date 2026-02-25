import { z } from "zod";

export type PostStatus = "draft" | "published";

export interface MarkdownBlock {
  type: "markdown";
  text: string; // Markdown content
}

export interface ImageBlock {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
}

export interface VideoBlock {
  type: "video";
  url: string;
  caption?: string;
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
  updated: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  content: ContentBlock[];
}

/**
 * A rendered post is returned by the `/api/posts/$id/rendered` endpoint,
 * and includes only what is needed to render the front-end.
 */
export interface RenderedPost {
  id: string;
  title: string;
  published: string;
  updated: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
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
}

// Zod schemas for DB inputs
const postStatusSchema = z.enum(["draft", "published"]);
const iso8601String = z.iso.datetime();
const slugString = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const urlString = z.string().url().nullable();

// Content Block Zod Schemas
const markdownBlockSchema = z.object({
  type: z.literal("markdown"),
  text: z.string().min(1),
});

const imageBlockSchema = z.object({
  type: z.literal("image"),
  url: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

const videoBlockSchema = z.object({
  type: z.literal("video"),
  url: z.string().min(1),
  caption: z.string().optional(),
});

const textBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
});

const headingBlockSchema = z.object({
  type: z.literal("heading"),
  text: z.string().min(1),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
});

const quoteBlockSchema = z.object({
  type: z.literal("quote"),
  text: z.string().min(1),
});

const codeBlockSchema = z.object({
  type: z.literal("code"),
  text: z.string().min(1),
});

const lineBlockSchema = z.object({
  type: z.literal("line"),
});

const breakBlockSchema = z.object({
  type: z.literal("break"),
});

const contentBlockSchema = z.discriminatedUnion("type", [
  markdownBlockSchema,
  imageBlockSchema,
  videoBlockSchema,
  textBlockSchema,
  headingBlockSchema,
  quoteBlockSchema,
  codeBlockSchema,
  lineBlockSchema,
  breakBlockSchema,
]);

export const createPostInputSchema = z.object({
  title: z.string(),
  published: iso8601String,
  updated: iso8601String,
  slug: slugString,
  status: postStatusSchema,
  hidden: z.boolean(),
  gallery: z.boolean(),
  content: z.array(contentBlockSchema),
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
  content: z.array(contentBlockSchema),
  external_link: urlString,
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
