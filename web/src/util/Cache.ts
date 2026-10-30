export const HTML_CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=39600";
export const FILE_CACHE_CONTROL = "public, max-age=604800, stale-while-revalidate=1987200";
export const FILE_NOT_FOUND_CACHE_CONTROL = "public, s-maxage=3600";

export const POST_LISTS_CACHE_TAG = "post-lists";

export function postCacheTag(id: string): string {
  return `post:${id}`;
}
