import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import * as queries from "./queries";
import {
  createPostInputSchema,
  ListPostsFilters,
  Post,
  PostListItem,
  updatePostInputSchema,
} from "./types";

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Post | null> => {
    return queries.getPost(env.WEB_DB, id);
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
    return queries.updatePost(env.WEB_DB, input);
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<boolean> => {
    return queries.deletePost(env.WEB_DB, id);
  });
