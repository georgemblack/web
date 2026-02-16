import rss from "@astrojs/rss";
import { getPosts } from "../../util/Api";
import { url } from "../../util/Format";

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: "George Black",
    description:
      "George is a software engineer working in Austin, with a small home on the internet.",
    site: context.site,
    items: posts.map((item) => ({
      title: item.title,
      pubDate: item.published,
      link: url(item),
      trailingSlash: false,
      content: item.content_html,
    })),
  });
}
