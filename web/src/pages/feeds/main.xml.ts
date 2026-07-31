import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getLiveCollection } from "astro:content";

import { url } from "../../util/Format";
import { STANDARD_CONTENT_CACHE_CONTROL } from "../../util/Cache";

export async function GET(context: APIContext) {
  const { entries, error } = await getLiveCollection("posts");
  if (error || !entries)
    return new Response("Failed to load posts", { status: 502 });

  const posts = entries.map((e) => e.data);
  const response = await rss({
    title: "George Black",
    description:
      "George is a software engineer working in Austin, with a small home on the internet.",
    site: context.site || "",
    items: posts.map((item) => ({
      title: item.title,
      pubDate: new Date(item.published),
      link: url(item),
      trailingSlash: false,
      content: item.content_html,
    })),
  });
  response.headers.set(
    "Cache-Control",
    STANDARD_CONTENT_CACHE_CONTROL,
  );
  return response;
}
