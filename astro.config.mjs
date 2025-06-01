// @ts-check
import { defineConfig, envField } from "astro/config";

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://george.black",
  integrations: [
    sitemap({
      serialize(item) {
        // Trim trailing slashes
        if (item.url.endsWith("/")) item.url = item.url.slice(0, -1);
        return item;
      },
    }),
  ],
  env: {
    schema: {
      KIRBY_API_URL: envField.string({ context: "server", access: "public" }),
    },
  },
});
