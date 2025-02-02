import { defineCollection, z } from "astro:content";
import { getPosts, getLikes } from "./util/Api";

const posts = defineCollection({
  loader: async () => {
    return await getPosts();
  },
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    published: z.string(),
    visible: z.boolean(),
    gallery: z.boolean(),
    preview: z.string(),
    content: z.string(),
    images: z.array(z.string()),
  }),
});

const likes = defineCollection({
  loader: async () => {
    return await getLikes();
  },
  schema: z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    published: z.string(),
    url: z.string(),
    content: z.string(),
  }),
});

export const collections = { posts, likes };
