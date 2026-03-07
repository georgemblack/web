import { env } from "cloudflare:workers";
import { createServerFn } from "@tanstack/react-start";
import {
  ContentBlock,
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
    return env.WEB_DB_SERVICE.getPost(id);
  });

export const getRenderedPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<RenderedPost | null> => {
    return env.WEB_DB_SERVICE.getRenderedPost(id);
  });

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((input: ListPostsFilters | undefined) => input)
  .handler(async ({ data: filters }): Promise<PostListItem[]> => {
    return env.WEB_DB_SERVICE.listPosts(filters);
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator(createPostInputSchema)
  .handler(async ({ data: input }): Promise<Post> => {
    return env.WEB_DB_SERVICE.createPost(input);
  });

export const updatePost = createServerFn({ method: "POST" })
  .inputValidator(updatePostInputSchema)
  .handler(async ({ data: input }): Promise<Post | null> => {
    return env.WEB_DB_SERVICE.updatePost(input);
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<boolean> => {
    return env.WEB_DB_SERVICE.deletePost(id);
  });

export const migrateImageUrls = createServerFn({ method: "POST" }).handler(
  async (): Promise<number> => {
    const posts = await env.WEB_DB_SERVICE.listPosts();
    let migratedCount = 0;

    for (const postListItem of posts) {
      const post = await env.WEB_DB_SERVICE.getPost(postListItem.id);
      if (!post) continue;

      let hasImageBlocks = false;
      const migratedContent: ContentBlock[] = post.content.map((block) => {
        if (block.type !== "image") return block;
        // Handle blocks that still have the old "url" field
        const oldBlock = block as Record<string, unknown>;
        if ("url" in oldBlock && !("key" in oldBlock)) {
          hasImageBlocks = true;
          const url = oldBlock.url as string;
          // Extract key from full URL like https://george.black/files/2020/pic.jpg
          const key = url.replace("https://george.black/files/", "");
          return {
            type: "image" as const,
            key,
            alt: oldBlock.alt as string,
            caption: oldBlock.caption as string | undefined,
          };
        }
        return block;
      });

      if (hasImageBlocks) {
        await env.WEB_DB_SERVICE.updatePost({
          id: post.id,
          title: post.title,
          published: post.published,
          slug: post.slug,
          status: post.status,
          hidden: post.hidden,
          gallery: post.gallery,
          external_link: post.external_link,
          content: migratedContent,
        });
        migratedCount++;
      }
    }

    return migratedCount;
  },
);
