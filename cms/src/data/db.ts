import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import * as queries from "./queries";
import {
  createPostInputSchema,
  ListPostsFilters,
  Post,
  PostListItem,
  RenderedPost,
  updatePostInputSchema,
} from "./types";

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Post | null> => {
    return queries.getPost(env.WEB_DB, id);
  });

export const getRenderedPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<RenderedPost | null> => {
    return queries.getRenderedPost(env.WEB_DB, id);
  });

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((input: ListPostsFilters | undefined) => input)
  .handler(async ({ data: filters }): Promise<PostListItem[]> => {
    return queries.listPosts(env.WEB_DB, filters);
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator(createPostInputSchema)
  .handler(async ({ data: input }): Promise<Post> => {
    return queries.createPost(env.WEB_DB, input);
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator(updatePostInputSchema)
  .handler(async ({ data: input }): Promise<Post | null> => {
    const post = await queries.updatePost(env.WEB_DB, input);
    if (post && post.status === "published") {
      await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
    }
    return post;
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<boolean> => {
    const post = await queries.getPost(env.WEB_DB, id);
    const deleted = await queries.deletePost(env.WEB_DB, id);
    if (deleted && post?.status === "published") {
      await fetch(env.DEPLOY_HOOK_URL, { method: "POST" });
    }
    return deleted;
  });
