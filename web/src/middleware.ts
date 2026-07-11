import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

// Files come straight from R2. The edge cache in front of the worker
// (cache.enabled in wrangler.jsonc) caches them based on these headers —
// same stale-while-revalidate pattern as the rest of the site, but the
// assets rarely change, so we let both the edge and the browser hold them
// for 7 days.
const FILES_CACHE_CONTROL =
  "public, max-age=604800, stale-while-revalidate=86400";

// Serve /files/* from R2, in place of the old standalone "files" worker.
// Everything else falls through to Astro's normal routing.
export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith("/files/")) return next();

  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const key = url.pathname.replace("/files/", "");

  // Prefer the pre-processed object, fall back to the original.
  // `??` short-circuits, so the originals bucket is only hit on a miss.
  const object =
    (await env.WEB_FILES_CACHE.get(key)) ?? (await env.WEB_FILES.get(key));

  if (!object) {
    return new Response("Not Found", {
      status: 404,
      headers: { "cache-control": "public, s-maxage=3600" },
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers); // content-type etc. from R2 metadata
  headers.set("cache-control", FILES_CACHE_CONTROL); // our 7-day policy
  return new Response(object.body, { headers });
});
