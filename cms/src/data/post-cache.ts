import { env } from "cloudflare:workers";

// Keep the RPC contract local so the CMS can be deployed as its own repository.
type WebService = Fetcher & {
  purgePost(postId: string): Promise<void>;
};

export async function purgePostCache(postId: string): Promise<void> {
  // Preview CMS instances have no production service binding.
  if (!env.WEB) return;
  const web = env.WEB as WebService;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await web.purgePost(postId);
      return;
    } catch (error) {
      if (attempt === 2) {
        console.error("Post changed, but cache purge failed", { postId, error });
        throw new Error(
          "The post change was saved, but the public cache could not be refreshed. Cached content may remain until it expires.",
          { cause: error },
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
}
