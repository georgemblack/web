// One hour fresh, followed by eleven hours of stale-while-revalidate.
export const STANDARD_CONTENT_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=39600";
export const POST_LISTS_CACHE_TAG = "post-lists";
export const IMAGE_CACHE_CONTROL = "public, max-age=604800";

export function postCacheTag(id: string): string {
  return `post:${id}`;
}
