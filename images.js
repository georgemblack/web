/**
 * This script copies all images hosted on Kirby to the 'public' assets directory, resizing them along the way.
 * By doing this, we can use Kirby as a CMS for posts *and* images, while still serving optimized images from Workers static assets.
 */
import fs from "fs/promises";
import path from "path";

const KIRBY_API_URL = process.env.KIRBY_API_URL;
const OUTPUT_ROOT = path.resolve(process.cwd(), "public");
const MAX_PARALLEL = 8;

const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID;
const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET;

async function fetchPosts() {
  const endpoint = `${KIRBY_API_URL}/blog.json`;

  const headers = {};
  if(CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_ACCESS_CLIENT_SECRET;
  }

  const response = await fetch(endpoint, { headers });
  if (!response.ok)
    throw new Error(`${endpoint} → ${response.status} ${response.statusText}`);
  return response.json();
}

function collectImageUrls(posts) {
  return [...new Set(posts.flatMap((p) => p.images ?? []))];
}

// If image is hosted at 'https://example.com/some/image.jpg', save it to 'some/image.avif' in the public directory.
function urlToOutputPath(url) {
  const relativePath = new URL(url).pathname.replace(/^\//, "");
  const outputPath = path.join(OUTPUT_ROOT, relativePath);
  return outputPath.replace(/\.\w+$/, ".avif");
}

// Download the image from Kirby.
// Proxy image through Cloudflare Images to ensure it is resized and converted to AVIF.
async function downloadImage(url) {
  const endpoint = `https://george.black/cdn-cgi/image/width=1600,format=avif/${url}`;

  const headers = {
    "Accept": "image/avif",
  };
  if(CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_ACCESS_CLIENT_SECRET;
  }

  const response = await fetch(endpoint, { headers });
  if (!response.ok)
    throw new Error(`${url} → ${response.status} ${response.statusText}`);

  const destination = urlToOutputPath(url);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  const buf = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, buf);
  console.log(`✔ ${path.relative(OUTPUT_ROOT, destination)}`);
}

async function main() {
  const posts = await fetchPosts();
  const imageUrls = collectImageUrls(posts);

  const queue = [...imageUrls];
  const workers = Array.from({ length: MAX_PARALLEL }, async () => {
    while (queue.length) {
      const url = queue.pop();
      try {
        await downloadImage(url);
      } catch (e) {
        console.error(`✖ ${url}: ${e.message}`);
      }
    }
  });

  await Promise.all(workers);
}

main().catch((e) => {
  console.error(`fatal: ${e.message}`);
  process.exit(1);
});
