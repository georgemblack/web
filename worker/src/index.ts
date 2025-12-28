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

    const object = await env.WEB_FILES.get(key);
    if (!object) {
      response = new Response("Not Found", {
        status: 404,
        headers: {
          "cache-control": "public, max-age=3600",
        },
      });
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
    }

    const optimizeKeys = await env.WEB_FILES_META.get<string[]>(
      "optimized_files",
      "json"
    );

    if (optimizeKeys && optimizeKeys.includes(key)) {
      const optimized = await env.IMAGES.input(object.body)
        .transform({ width: 1200 })
        .output({ format: "image/avif" });

      response = optimized.response();
      response.headers.set("cache-control", CACHE_CONTROL);
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
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
  },
} satisfies ExportedHandler<Env>;
