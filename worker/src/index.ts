export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    // 1. Check cache
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // 2. Check R2 bucket for the object
    const object = await env.WEB_FILES.get(key);
    if (!object) {
      return new Response("Not Found", { status: 404 });
    }

    // 3. Read optimized_files from KV
    const optimizedFiles = await env.WEB_FILES_META.get<string[]>(
      "optimized_files",
      "json"
    );
    // TODO: Use optimizedFiles to determine if file should be optimized

    // 4. Build response and cache it
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");

    const response = new Response(object.body, {
      headers,
    });

    ctx.waitUntil(cache.put(request, response.clone()));

    return response;
  },
} satisfies ExportedHandler<Env>;
