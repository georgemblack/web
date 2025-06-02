import { getPosts } from "./Api";
import { absoluteUrl, image } from "./Format";

type Feed = {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description: string;
  user_comment: string;
  icon: string;
  favicon: string;
  authors: Author[];
  language: string;
  items: FeedItem[];
};

type Author = {
  name: string;
  url: string;
  avatar: string;
};

type FeedItem = {
  id: string;
  url: string;
  title: string;
  content_html: string;
  date_published: string;
  image?: string;
};

export async function generate(): Promise<string> {
  const posts = await getPosts();

  // Generate feed items
  const feedItems: FeedItem[] = posts.map((item) => {
    const feedItem: FeedItem = {
      id: absoluteUrl(item),
      url: absoluteUrl(item),
      title: item.title,
      content_html: item.content,
      date_published: item.published,
    };
    if (image(item)) feedItem.image = image(item);
    return feedItem;
  });

  // Build feed
  const feed: Feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "George Black",
    home_page_url: "https://george.black",
    feed_url: "https://george.black/feeds/main.json",
    description:
      "George is a software engineer working in Chicago, with a small home on the internet.",
    user_comment:
      "Hello friend! You've found my JSON feed! You can use this to follow my blog in a feed reader, such as NetNewsWire.",
    icon: "https://george.black/icons/json-feed-icon.png",
    favicon: "https://george.black/icons/json-feed-icon.png",
    authors: [
      {
        name: "George Black",
        url: "https://george.black",
        avatar: "https://george.black/icons/json-feed-avatar.jpg",
      },
    ],
    language: "en-US",
    items: feedItems,
  };

  return JSON.stringify(feed);
}
