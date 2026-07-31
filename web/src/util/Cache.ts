const RECENT_POST_AGE_MS = 24 * 60 * 60 * 1000;

// These directives include the fresh and stale periods, so their combined
// lifetime is one hour and twelve hours respectively.
export const RECENT_CONTENT_CACHE_CONTROL =
  "public, s-maxage=600, stale-while-revalidate=3000";
export const STANDARD_CONTENT_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=39600";

export function cacheControlForPost(published: string): string {
  const publishedAt = new Date(published).getTime();
  const isRecent =
    Number.isFinite(publishedAt) && Date.now() - publishedAt < RECENT_POST_AGE_MS;

  return isRecent
    ? RECENT_CONTENT_CACHE_CONTROL
    : STANDARD_CONTENT_CACHE_CONTROL;
}
