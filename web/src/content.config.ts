import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  loader: async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const clientId = import.meta.env.CF_ACCESS_CLIENT_ID;
    const clientSecret = import.meta.env.CF_ACCESS_CLIENT_SECRET;
    if (clientId && clientSecret) {
      headers["CF-Access-Client-Id"] = clientId;
      headers["CF-Access-Client-Secret"] = clientSecret;
    }

    const response = await fetch(
      "https://cms.georgeblack.workers.dev/api/posts",
      { method: "GET", headers },
    );
    interface ListItem {
      id: string;
      status: string;
    }
    const listItems: ListItem[] = await response.json();
    const published = listItems.filter((post) => post.status === "published");

    const posts = [];
    for (const item of published) {
      const res = await fetch(
        `https://cms.georgeblack.workers.dev/api/posts/${item.id}/rendered`,
        { method: "GET", headers },
      );
      posts.push(await res.json());
    }

    posts.sort(
      (a: { published: string }, b: { published: string }) =>
        a.published < b.published ? 1 : -1,
    );

    return posts;
  },
  schema: z.object({
    title: z.string(),
    published: z.string(),
    slug: z.string(),
    hidden: z.boolean(),
    gallery: z.boolean(),
    external_link: z.string().nullable(),
    content_html: z.string(),
    preview_html: z.string().nullable(),
    images: z.array(z.string()),
  }),
});

export const collections = { posts };
