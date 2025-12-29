const CACHE_CONTROL = "public, max-age=31536000";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let response: Response | undefined;
    const url = new URL(request.url);
    const key = url.pathname.replace("/files/", "");

    const cache = caches.default;
    response = await cache.match(request);
    if (response) return response;

    // Object is not in volatile cache. Check to see if object marked for optimization.
    const optimizedImageKeys =
      (await env.WEB_FILES_META.get<string[]>("optimized_files", "json")) || [];

    if (!optimizedImageKeys.includes(key)) {
      // Object is not marked for optimization.
      // Simply return it from R2 and cache it.
      const object = await env.WEB_FILES.get(key);
      if (!object) {
        ctx.waitUntil(cache.put(request.url, notFoundResponse()));
        return notFoundResponse();
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", CACHE_CONTROL);

      response = new Response(object.body, {
        headers,
      });
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
    }

    // Object is marked for optimization – check to see if it's in the cache bucket.
    const cachedObject = await env.WEB_FILES_CACHE.get(key);
    if (cachedObject) {
      const headers = new Headers();
      cachedObject.writeHttpMetadata(headers);
      headers.set("etag", cachedObject.httpEtag);
      headers.set("cache-control", CACHE_CONTROL);
      response = new Response(cachedObject.body, {
        headers,
      });
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
    }

    // Otherwise, optimize the object (it's an image) and cache it.
    const originalObject = await env.WEB_FILES.get(key);
    if (!originalObject) {
      ctx.waitUntil(cache.put(request.url, notFoundResponse()));
      return notFoundResponse();
    }
    const optimizedObject = await env.IMAGES.input(originalObject.body)
      .transform({ width: 1200 })
      .output({ format: "image/avif" });

    response = optimizedObject.response();
    response.headers.set("cache-control", CACHE_CONTROL);
    ctx.waitUntil(cache.put(request.url, response.clone()));
    ctx.waitUntil(
      env.WEB_FILES_CACHE.put(key, optimizedObject.image(), {
        httpMetadata: {
          contentType: optimizedObject.contentType(),
        },
      })
    );
    return response;
  },
} satisfies ExportedHandler<Env>;

function notFoundResponse(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "cache-control": "public, max-age=3600",
    },
  });
}
