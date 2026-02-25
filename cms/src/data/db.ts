import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import {
  createPostInputSchema,
  Post,
  PostListItem,
  PostStatus,
  RenderedPost,
  updatePostInputSchema,
} from "./types";

export interface ListPostsFilters {
  hidden?: boolean;
  state?: PostStatus;
}

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Post | null> => {
    return env.CMS_DB.getPost(id);
  });

export const getRenderedPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<RenderedPost | null> => {
    return env.CMS_DB.getRenderedPost(id);
  });

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((input: ListPostsFilters | undefined) => input)
  .handler(async ({ data: filters }): Promise<PostListItem[]> => {
    return env.CMS_DB.listPosts(filters);
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator(createPostInputSchema)
  .handler(async ({ data: input }): Promise<Post> => {
    return env.CMS_DB.createPost(input);
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator(updatePostInputSchema)
  .handler(async ({ data: input }): Promise<Post | null> => {
    return env.CMS_DB.updatePost(input);
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<boolean> => {
    return env.CMS_DB.deletePost(id);
  });
