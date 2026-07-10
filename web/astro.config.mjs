// @ts-check
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://george.black",
  // Render pages on-demand in the Cloudflare Worker instead of building static files.
  output: "server",
  adapter: cloudflare(),
  integrations: [
    sitemap({
      serialize(item) {
        // Trim trailing slashes
        if (item.url.endsWith("/")) item.url = item.url.slice(0, -1);
        return item;
      },
    }),
  ],
});
