import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "../../util/Api";
import { url } from "../../util/Format";

export async function GET(context: APIContext) {
  const posts = await getPosts();
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
