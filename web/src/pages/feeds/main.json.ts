import { generateFeed } from "../../util/Feed";
import { STANDARD_CONTENT_CACHE_CONTROL, POST_LISTS_CACHE_TAG } from "../../util/Cache";

export async function GET() {
  return new Response(JSON.stringify(await generateFeed()), {
    headers: {
      "Content-Type": "application/feed+json",
      "Cache-Control": STANDARD_CONTENT_CACHE_CONTROL,
      "Cache-Tag": POST_LISTS_CACHE_TAG,
    },
  });
}
