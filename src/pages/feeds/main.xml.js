import rss from "@astrojs/rss";
import { getPosts } from "../../util/Api";
import { fullSlug } from "../../util/Format";

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: "George Black",
    description:
      "George is a software engineer working in Austin, with a small home on the internet.",
    site: context.site,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: post.published,
      link: `/${fullSlug(post)}`,
      trailingSlash: false,
      content: post.content,
    })),
  });
}
