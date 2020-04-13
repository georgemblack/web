import mime from "mime";

const EDGE_CACHE_TTL = "2592000";
const ORIGIN = "https://georgeblack.me";
const REMOTE_STORAGE_URL = "https://storage.googleapis.com/georgeblack.me";

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
  const cache = caches.default;
  let response, pathKey;

  // Check for valid method
  if (!["GET", "HEAD"].includes(event.request.method))
    return new Response("Bad request", { status: 400 });

  const [pathname, mimeType] = getRequestInfo(event);

  // get key for this asset
  // if an error is thrown, pathname is invalid
  try {
    pathKey = getPathKey(pathname);
  } catch (e) {
    return await getNotFoundResponse();
  }

  // check cache for asset
  // if cache hit, modify headers and return
  response = await cache.match(`${ORIGIN}/${pathKey}`);
  if (response) {
    let headers = new Headers(response.headers);
    response = new Response(response.body, { headers });
    response.headers.set("CF-Cache-Status", "HIT");
    response.headers.set("Cache-Control", `public, max-age=${browserCacheMaxAge(pathKey)}`);
    response.headers.delete("Age");
    return response;
  }

  // asset resides in Workers KV or Cloud Storage
  try {
    if (isRemoteAsset(pathKey)) {
      response = await getAssetFromURL(pathKey, mimeType);
    } else {
      response = await getAssetFromKV(pathKey, mimeType);
    }
  } catch (e) {
    return await getNotFoundResponse();
  }

  // cache item
  response.headers.set("Cache-Control", `max-age=${EDGE_CACHE_TTL}`);
  event.waitUntil(cache.put(`${ORIGIN}/${pathKey}`, response.clone()));

  // set browser headers
  response.headers.set("Cache-Control", `public, max-age=${browserCacheMaxAge(pathKey)}`);
  response.headers.set("CF-Cache-Status", "MISS");
  return response;
}

/**
 * Retrieve asset from URL
 */
async function getAssetFromURL(pathKey, mimeType) {
  const response = await fetch(`${REMOTE_STORAGE_PATH}/${pathKey}`);
  if (response.status != 200) {
    throw new Error("Asset not found in Cloud Storage!");
  }
  return new Response(response.body, {
    status: 200,
    headers: { "Content-Type": mimeType },
  });
}

/**
 * Retrieve asset from Workers KV
 */
async function getAssetFromKV(pathKey, mimeType) {
  const body = await __STATIC_CONTENT.get(pathKey, "arrayBuffer");
  return new Response(body, {
    headers: { "Content-Type": mimeType },
  });
}

/**
 * Return 404 page from KV
 * If 404 page does not exist, return text response
 */
async function getNotFoundResponse() {
  const pathKey = JSON.parse(__STATIC_CONTENT_MANIFEST)["404/index.html"];
  if (!pathKey) return new Response("404 not found", { status: 404 });
  const body = await __STATIC_CONTENT.get(pathKey, "arrayBuffer");
  return new Response(body, {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * Calculate browser cache TTL
 */
function browserCacheMaxAge(pathname) {
  const extension = pathname.split(".").pop();
  if (/^(jpg|jpeg|png|webp|mov|ico|svg|webmanifest)$/.test(extension)) return "7776000"; // 90 days
  if (/^(js|css)$/.test(extension)) return "86400"; // 1 day
  return "900";
}

/**
 * Get sanitized pathname and mime-type from event
 */
function getRequestInfo(event) {
  let pathname = new URL(event.request.url).pathname;
  let mimeType;

  // if path looks like dir, append index.html
  if (pathname.endsWith("/")) {
    pathname = pathname.concat("index.html");
    mimeType = "text/html";
  } else {
    mimeType = mime.getType(pathname);
    // if path doesn't look like valid content
    if (!mimeType) {
      pathname = pathname.concat("/index.html");
      mimeType = "text/html";
    }
  }
  // remove leading slash
  pathname = pathname.replace(/^\/+/, "");

  return [pathname, mimeType];
}

/**
 * Get unique key for asset
 */
function getPathKey(pathname) {
  const pathKey = JSON.parse(__STATIC_CONTENT_MANIFEST)[pathname];
  if (pathKey) return pathKey;
  if (!isRemoteAsset(pathname)) throw new Error("Invalid path for asset!");
  return pathname;
}

/**
 * Return true if asset should reside in cloud storage
 */
function isRemoteAsset(pathname) {
  return pathname.includes("assets/");
}
