import { defineLiveCollection } from "astro:content";

import { postSchema, postsLoader } from "./loaders/posts";

const posts = defineLiveCollection({
  loader: postsLoader(),
  schema: postSchema,
});

export const collections = { posts };
