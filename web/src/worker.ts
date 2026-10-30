import { handle } from "@astrojs/cloudflare/handler";
import { WorkerEntrypoint } from "cloudflare:workers";

import { POST_LISTS_CACHE_TAG, postCacheTag } from "./util/Cache";

// HTTP and RPC share the default entrypoint, which owns the page cache.
export default class Web extends WorkerEntrypoint<Env> {
  fetch(request: Request) {
    return handle(request, this.env, this.ctx);
  }

  // Only available through a service binding; this is not an HTTP route.
  async purgePost(postId: string): Promise<void> {
    const cache = this.ctx.cache;
    if (!cache) throw new Error("Workers Cache is not enabled");
    const result = await cache.purge({
      tags: [postCacheTag(postId), POST_LISTS_CACHE_TAG],
    });
    if (!result.success) {
      throw new Error(`Cache purge failed: ${JSON.stringify(result.errors)}`);
    }
  }
}
