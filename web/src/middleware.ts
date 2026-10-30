import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

import { serveFile } from "./data/files";

export const onRequest = defineMiddleware(async (context, next) => {
  if (!new URL(context.request.url).pathname.startsWith("/files/")) return next();
  return serveFile(context.request, env);
});
