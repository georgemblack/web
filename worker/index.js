import mime from "mime";

const EDGE_CACHE_TTL = "2592000";
const ORIGIN = "https://georgeblack.me";
const REMOTE_STORAGE_URL = "https://storage.googleapis.com/georgeblack.me";
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
  if (!["GET", "HEAD"].includes(event.request.method))
    return new Response("Bad request", { status: 400 });

  // route requests
  const pathname = getPathname(event);
  if (pathname.startsWith("assets/")) {
    return await handleAssetFromURL(event);
  }
  return await handleAssetFromKV(event);
}

/**
 * Fetch asset from Cloudflare Workers KV
 */
async function handleAssetFromKV(event) {
  const cache = caches.default;
  const pathname = getPathname(event);
  const pathKey = getKVKey(pathname);

  if (!pathKey) {
    return await getNotFoundResponse();
  }

  // check cache
  let response = await cache.match(`${ORIGIN}/${pathKey}`);
  if (response) {
    let headers = new Headers(response.headers);
    response = new Response(response.body, { headers });
    response.headers.set("CF-Cache-Status", "HIT");
    setBrowserHeaders(response, pathname);
    return response;
  }

  // build request
  const mimeType = mime.getType(pathname) || "text/html";
  const body = await __STATIC_CONTENT.get(pathKey, "arrayBuffer");
  response = new Response(body, {
    headers: { "Content-Type": mimeType },
  });

  // send to cache
  setEdgeCacheHeaders(response);
  event.waitUntil(cache.put(`${ORIGIN}/${pathKey}`, response.clone()));

  setBrowserHeaders(response, pathname);
  response.headers.set("CF-Cache-Status", "MISS");
  return response;
}

/**
 * Fetch asset from a URL
 */
async function handleAssetFromURL(event) {
  const cache = caches.default;
  const pathname = getPathname(event);

  // check cache
  let response = await cache.match(`${ORIGIN}/${pathname}`);
  if (response) {
    let headers = new Headers(response.headers);
    response = new Response(response.body, { headers });
    response.headers.set("CF-Cache-Status", "HIT");
    setBrowserHeaders(response, pathname);
    return response;
  }

  const remoteStorageResponse = await fetch(
    `${REMOTE_STORAGE_URL}/${pathname}`
  );
  if (remoteStorageResponse.status != 200) {
    return await getNotFoundResponse();
  }

  // build request
  const mimeType = mime.getType(pathname) || "text/html";
  response = new Response(remoteStorageResponse.body, {
    headers: { "Content-Type": mimeType },
  });

  // send to cache
  setEdgeCacheHeaders(response);
  event.waitUntil(cache.put(`${ORIGIN}/${pathname}`, response.clone()));

  // set browser headers
  setBrowserHeaders(response, pathname);
  response.headers.set("CF-Cache-Status", "MISS");
  return response;
}

/**
 * Fetch 404 page from Cloudflare Workers KV
 * If page doesn't exist, return text response
 */
async function getNotFoundResponse() {
  const pathKey = getKVKey(NOT_FOUND_ASSET_PATHNAME);
  if (!pathKey) {
    return new Response("404 not found!", { status: 404 });
  }

  const body = await __STATIC_CONTENT.get(pathKey, "arrayBuffer");
  return new Response(body, {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * Get key of object stored in Cloudflare Workers KV
 */
function getKVKey(pathname) {
  return JSON.parse(__STATIC_CONTENT_MANIFEST)[pathname];
}

/**
 * Get sanitized pathname of asset
 */
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

/**
 * Set headers for request to be sent to edge cache
 */
function setEdgeCacheHeaders(response) {
  response.headers.set("Cache-Control", `max-age=${EDGE_CACHE_TTL}`);
}

/**
 * Set headers for request to be sent to browser
 */
function setBrowserHeaders(response, pathname) {
  response.headers.delete("Age");
  response.headers.set(
    "Cache-Control",
    `public, max-age=${browserCacheMaxAge(pathname)}`
  );
}

/**
 * Calculate the max age for an asset in the browser
 */
function browserCacheMaxAge(pathname) {
  const extension = pathname.split(".").pop();
  if (/^(jpg|jpeg|png|webp|mov|ico|svg|webmanifest)$/.test(extension))
    return "7776000"; // 90 days
  if (/^(js|css)$/.test(extension)) return "86400"; // 1 day
  return "900";
}
