import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { url } from "../../util/Format";

export async function GET(context: APIContext) {
  const entries = await getCollection("posts");
  const posts = entries.map((e) => e.data);
  posts.sort((a, b) => (a.published < b.published ? 1 : -1));
  return rss({
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
}
