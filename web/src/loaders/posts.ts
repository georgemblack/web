import type { LiveLoader } from "astro/loaders";
import { z } from "astro/zod";
import { env } from "cloudflare:workers";

import { slug as postSlug } from "../util/Format";

// Shape of a published post as returned by the CMS "rendered" endpoint.
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

export type PostData = z.infer<typeof postSchema>;

// A post can be looked up by its URL slug (e.g. "2024/my-post") or by CMS id.
type PostEntryFilter = { slug: string } | { id: string };

const CMS_BASE = "https://cms.georgeblack.workers.dev";

// CF Access service-token credentials, read from the Secrets Store at request time.
async function requestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const clientId = await env.CF_ACCESS_CLIENT_ID.get();
  const clientSecret = await env.CF_ACCESS_CLIENT_SECRET.get();
  if (clientId && clientSecret) {
    headers["CF-Access-Client-Id"] = clientId;
    headers["CF-Access-Client-Secret"] = clientSecret;
  }
  return headers;
}

// Fetch every published post, newest first, pairing each with its CMS id.
async function fetchPublishedPosts(): Promise<
  { id: string; data: PostData }[]
> {
  const headers = await requestHeaders();

  const listResponse = await fetch(`${CMS_BASE}/api/posts`, { headers });
  if (!listResponse.ok) {
    throw new Error(`Failed to list posts: ${listResponse.status}`);
  }
  const listItems: { id: string; status: string }[] = await listResponse.json();
  const published = listItems.filter((item) => item.status === "published");

  const posts = await Promise.all(
    published.map(async (item) => {
      const response = await fetch(
        `${CMS_BASE}/api/posts/${item.id}/rendered`,
        { headers },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch post ${item.id}: ${response.status}`);
      }
      const data = (await response.json()) as PostData;
      return { id: item.id, data };
    }),
  );

  posts.sort((a, b) => (a.data.published < b.data.published ? 1 : -1));
  return posts;
}

// Fetch a single rendered post from the CMS, returning its id alongside the
// parsed data. Resolves to null when the post doesn't exist.
async function fetchRenderedPost(
  path: string,
): Promise<{ id: string; data: PostData } | null> {
  const response = await fetch(`${CMS_BASE}${path}`, {
    headers: await requestHeaders(),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch post: ${response.status}`);
  }
  // The id endpoint returns `null` (200) for a missing post; by-slug returns 404.
  const raw = (await response.json()) as { id: string } | null;
  if (!raw) return null;
  return { id: raw.id, data: postSchema.parse(raw) };
}

export function postsLoader(): LiveLoader<PostData, PostEntryFilter> {
  return {
    name: "cms-posts",

    loadCollection: async () => {
      try {
        const posts = await fetchPublishedPosts();
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
        let match: { id: string; data: PostData } | null;
        if ("slug" in filter) {
          // filter.slug is the full URL path (e.g. "2024/my-post"); the CMS
          // looks up by the bare, unique slug — the last path segment.
          const bareSlug = filter.slug.split("/").pop() ?? filter.slug;
          match = await fetchRenderedPost(
            `/api/posts/by-slug/${encodeURIComponent(bareSlug)}`,
          );
          // Reject a mismatched year so each post has one canonical URL.
          if (match && postSlug(match.data) !== filter.slug) return undefined;
        } else {
          match = await fetchRenderedPost(
            `/api/posts/${encodeURIComponent(filter.id)}/rendered`,
          );
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
