import type { LiveLoader } from "astro/loaders";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";

import {
  getPublishedPostById,
  getPublishedPostBySlug,
  listPublishedPosts,
} from "../data/posts";
import type { PostData, PostRecord } from "../data/posts";
import { slug as postSlug } from "../util/Format";

// Shape of a published post as loaded from D1.
export const postSchema = z.object({
  title: z.string(),
  published: z.string(),
  slug: z.string(),
  hidden: z.boolean(),
  gallery: z.boolean(),
  external_link: z.string().nullable(),
  content_html: z.string(),
  preview_html: z.string().nullable(),
  images: z.array(
    z.object({
      src: z.string(),
      alt: z.string(),
    }),
  ),
});

// A post can be looked up by its URL slug (e.g. "2024/my-post") or by CMS id.
type PostEntryFilter = { slug: string } | { id: string };

export function postsLoader(): LiveLoader<PostData, PostEntryFilter> {
  return {
    name: "posts",

    loadCollection: async () => {
      try {
        const posts = await listPublishedPosts(env.WEB_DB);
        return {
          entries: posts.map((post) => ({
            id: post.id,
            data: post.data,
            cacheHint: { tags: [`post:${post.id}`] },
          })),
          cacheHint: { tags: ["posts"] },
        };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error : new Error("Failed to load posts"),
        };
      }
    },

    loadEntry: async ({ filter }) => {
      try {
        let match: PostRecord | null;
        if ("slug" in filter) {
          // filter.slug is the full URL path (e.g. "2024/my-post"), while the
          // database stores the bare, unique slug — the last path segment.
          const bareSlug = filter.slug.split("/").pop() ?? filter.slug;
          match = await getPublishedPostBySlug(env.WEB_DB, bareSlug);
          // Reject a mismatched year so each post has one canonical URL.
          if (match && postSlug(match.data) !== filter.slug) return undefined;
        } else {
          match = await getPublishedPostById(env.WEB_DB, filter.id);
        }
        if (!match) return undefined;
        return {
          id: match.id,
          data: match.data,
          cacheHint: { tags: [`post:${match.id}`] },
        };
      } catch (error) {
        return {
          error:
            error instanceof Error ? error : new Error("Failed to load post"),
        };
      }
    },
  };
}
