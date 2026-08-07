import type { APIContext } from "astro";
import { getLiveCollection } from "astro:content";

import { STANDARD_CONTENT_CACHE_CONTROL } from "../util/Cache";
import { slug } from "../util/Format";

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    switch (character) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return character;
    }
  });
}

export async function GET(context: APIContext): Promise<Response> {
  const { entries, error } = await getLiveCollection("posts");
  if (error || !entries)
    return new Response("Failed to load posts", { status: 502 });

  const site = context.site;
  if (!site) return new Response("Site URL is not configured", { status: 500 });

  const urls = entries.map((entry) => {
    const postUrl = new URL(`/${slug(entry.data)}`, site).href;
    return `  <url><loc>${escapeXml(postUrl)}</loc></url>`;
  });
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": STANDARD_CONTENT_CACHE_CONTROL,
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
