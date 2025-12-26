const CACHE_CONTROL = "public, max-age=31536000";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.replace("/files/", "");

    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    const object = await env.WEB_FILES.get(key);
    if (!object) return new Response("Not Found", { status: 404 });

    const toOptimize = await env.WEB_FILES_META.get<string[]>(
      "optimized_files",
      "json"
    );

    if (toOptimize && toOptimize.includes(key)) {
      const optimized = await env.IMAGES.input(object.body)
        .transform({ width: 1200 })
        .output({ format: "image/avif" });

      const response = optimized.response();
      response.headers.set("cache-control", CACHE_CONTROL);
      ctx.waitUntil(cache.put(request, response.clone()));
      return response;
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", CACHE_CONTROL);

    const response = new Response(object.body, {
      headers,
    });
    ctx.waitUntil(cache.put(request, response.clone()));
    return response;
  },
} satisfies ExportedHandler<Env>;
