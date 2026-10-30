import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import { purgePostCache } from "./post-cache";
import * as queries from "./queries";
import {
  createPostInputSchema,
  ListPostsFilters,
  Post,
  PostListItem,
  updatePostInputSchema,
} from "./types";

export const getPost = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<Post | null> => {
    return queries.getPost(env.WEB_DB, id);
  });

export const listPosts = createServerFn({ method: "GET" })
  .validator((input: ListPostsFilters | undefined) => input)
  .handler(async ({ data: filters }): Promise<PostListItem[]> => {
    return queries.listPosts(env.WEB_DB, filters);
  });

export const createPost = createServerFn({ method: "POST" })
  .validator(createPostInputSchema)
  .handler(async ({ data: input }): Promise<Post> => {
    const post = await queries.createPost(env.WEB_DB, input);
    if (post.status === "published") await purgePostCache(post.id);
    return post;
  });

export const updatePost = createServerFn({ method: "POST" })
  .validator(updatePostInputSchema)
  .handler(async ({ data: input }): Promise<Post | null> => {
    const previous = await queries.getPost(env.WEB_DB, input.id);
    const post = await queries.updatePost(env.WEB_DB, input);
    if (post && (previous?.status === "published" || post.status === "published")) {
      await purgePostCache(post.id);
    }
    return post;
  });

export const deletePost = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<boolean> => {
    const previous = await queries.getPost(env.WEB_DB, id);
    const deleted = await queries.deletePost(env.WEB_DB, id);
    if (deleted && previous?.status === "published") await purgePostCache(id);
    return deleted;
  });
