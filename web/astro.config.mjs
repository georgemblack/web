// @ts-check
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://george.black",
  // Render pages on-demand in the Cloudflare Worker instead of building static files.
  output: "server",
  session: false,
  redirects: {
    "/home": "/blog",
    "/home/[page]": "/blog/[page]",
  },
  // Fetch internal pages in the background when a reader hovers over a link,
  // so they load faster on click. Only links marked with `data-astro-prefetch`
  // are prefetched, which keeps links inside post content (like /files/*) out.
  prefetch: true,
  adapter: cloudflare(),
  integrations: [
    sitemap({
      // Post pages are resolved from D1 at request time, so Astro cannot
      // discover their dynamic SSR URLs during the build.
      customSitemaps: ["https://george.black/sitemap-posts.xml"],
      serialize(item) {
        // Trim trailing slashes
        if (item.url.endsWith("/")) item.url = item.url.slice(0, -1);
        return item;
      },
    }),
  ],
});
