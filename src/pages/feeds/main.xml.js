import rss from "@astrojs/rss";
import { getCombined, getPosts } from "../../util/Api";
import { url } from "../../util/Format";

export async function GET(context) {
  const combined = await getCombined();
  return rss({
    title: "George Black",
    description:
      "George is a software engineer working in Austin, with a small home on the internet.",
    site: context.site,
    items: combined.map((item) => ({
      title: item.title,
      pubDate: item.published,
      link: url(item),
      trailingSlash: false,
      content: item.content,
    })),
  });
}
