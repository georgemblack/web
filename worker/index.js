import mime from "mime";

const ORIGIN = "https://georgeblack.me";
const EDGE_CACHE_TTL = "7776000";
const NOT_FOUND_ASSET_PATHNAME = "404/index.html";

addEventListener("fetch", (event) => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    event.respondWith(new Response("Internal error", { status: 500 }));
  }
});

/**
 * Primary event handler
 */
async function handleEvent(event) {
  let response;
  const cache = caches.default;
  const pathname = getPathname(event);
  const key = getKVKey(pathname);

  if (!["GET", "HEAD"].includes(event.request.method)) {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!key) {
    return await getNotFoundResponse();
  }

  // check cache
  response = await cache.match(`${ORIGIN}/${key}`);
  if (response) {
    let headers = new Headers(response.headers);
    response = new Response(response.body, { headers });
    response.headers.delete("Age");
    response.headers.set(
      "Cache-Control",
      `public, max-age=${browserCacheMaxAge(pathname)}`
    );
    return response;
  }

  // build request
  response = new Response(await getKVAsset(key), {
    headers: {
      "Content-Type": mime.getType(pathname) || "text/html",
      "Cache-Control": `public, max-age=${browserCacheMaxAge(pathname)}`,
    },
  });

  // send to cache
  let responseForCache = response.clone();
  responseForCache.headers.set("Cache-Control", `max-age=${EDGE_CACHE_TTL}`);
  event.waitUntil(cache.put(`${ORIGIN}/${key}`, responseForCache));

  return response;
}

async function getNotFoundResponse() {
  const key = getKVKey(NOT_FOUND_ASSET_PATHNAME);
  return new Response(await getKVAsset(key), {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });
}

function getPathname(event) {
  let pathname = new URL(event.request.url).pathname;
  if (pathname.endsWith("/")) {
    pathname = pathname.concat("index.html");
  }
  const filename = pathname.split("/").pop();
  if (!filename.includes(".")) {
    pathname = pathname.concat("/index.html");
  }
  pathname = pathname.replace(/^\/+/, "");
  return pathname;
}

function browserCacheMaxAge(pathname) {
  const extension = pathname.split(".").pop();
  if (/^(jpg|jpeg|png|webp|mov|ico|svg|webmanifest)$/.test(extension))
    return "7776000"; // 90 days
  if (/^(js|css)$/.test(extension)) return "86400"; // 1 day
  return "900";
}

function getKVKey(pathname) {
  return JSON.parse(__STATIC_CONTENT_MANIFEST)[pathname];
}

async function getKVAsset(key) {
  return await __STATIC_CONTENT.get(key, "arrayBuffer");
}
