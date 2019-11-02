import mime from 'mime'

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    event.respondWith(new Response('Internal error', { status: 500 }))
  }
})

async function handleEvent(event) {
  if (!['GET', 'HEAD'].includes(event.request.method)) return new Response('Bad request', { status: 400 })
  return await getAssetFromKV(event)
}

async function getAssetFromKV(event) {
  const EDGE_CACHE_TTL = '864000'
  const ORIGIN = 'https://georgeblack.me'

  const cache = caches.default
  let pathname = new URL(event.request.url).pathname
  let mimeType

  // if path looks like a directory append index.html
  if (pathname.endsWith('/')) {
    pathname = pathname.concat('index.html')
    mimeType = 'text/html'
  } else {
    mimeType = mime.getType(pathname)
    // if path doesn't look like valid content
    if (!mimeType) {
      pathname = pathname.concat('/index.html')
      mimeType = 'text/html'
    }
  }
  pathname = pathname.replace(/^\/+/, '')

  // static content mapping
  const pathKey = JSON.parse(__STATIC_CONTENT_MANIFEST)[pathname]
  if (!pathKey) return await getNotFoundResponse()

  // check cache
  const cacheKey = `${ORIGIN}/${pathKey}`
  let response = await cache.match(cacheKey)

  // cache hit
  if (response) {
    let headers = new Headers(response.headers)
    response = new Response(response.body, { headers })
    response.headers.set('CF-Cache-Status', 'HIT')
    response.headers.set('Cache-Control', `public, max-age=${browserCacheMaxAge(pathname)}`)
    response.headers.delete('Age')
    return response
  }

  // cache miss
  const body = await __STATIC_CONTENT.get(pathKey, 'arrayBuffer')
  const headers = new Headers({
    'Content-Type': mimeType,
    'Cache-Control': `max-age=${EDGE_CACHE_TTL}`,
  })
  response = new Response(body, { headers })

  event.waitUntil(cache.put(cacheKey, response.clone()))

  response.headers.set('Cache-Control', `public, max-age=${browserCacheMaxAge(pathname)}`)
  response.headers.set('CF-Cache-Status', 'MISS')
  return response
}

/**
 * Return 404 page from KV
 * If 404 page does not exist, return text response
 */
async function getNotFoundResponse() {
  const pathKey = JSON.parse(__STATIC_CONTENT_MANIFEST)['404.html']
  if (!pathKey) return new Response('404 not found', { status: 404 })
  const body = await __STATIC_CONTENT.get(pathKey, 'arrayBuffer')
  return new Response(body, { status: 404 })
}

/**
 * Calculate browser TTL
 */
function browserCacheMaxAge(pathname) {
  const extension = pathname.split('.').pop()
  if (/^(jpg|jpeg|png|webp|mov|ico)$/.test(extension)) return '2592000' // 30 days
  if (/^(js|css)$/.test(extension)) return '86400' // 1 day
  return '900'
}
