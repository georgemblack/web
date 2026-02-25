export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let response: Response | undefined;
    const url = new URL(request.url);
    const key = url.pathname.replace("/files/", "");

    const cache = caches.default;
    response = await cache.match(request.url);
    if (response) return response;

    // Object is not in volatile cache. Check cached objects bucket instead.
    const cachedObj = await env.WEB_FILES_CACHE.get(key);
    if (cachedObj) {
      const headers = new Headers();
      cachedObj.writeHttpMetadata(headers);

      response = new Response(cachedObj.body, {
        headers,
      });
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
    }

    // Return original object if it exists
    const original = await env.WEB_FILES.get(key);
    if (original) {
      const headers = new Headers();
      original.writeHttpMetadata(headers);

      response = new Response(original.body, {
        headers,
      });
      ctx.waitUntil(cache.put(request.url, response.clone()));
      return response;
    }

    // Return not found response
    ctx.waitUntil(cache.put(request.url, notFoundResponse()));
    return notFoundResponse();
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
