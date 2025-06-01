import { KIRBY_API_URL } from "astro:env/server";

export interface Post {
  id: string;
  title: string;
  slug: string;
  published: string;
  visible: boolean;
  gallery: boolean;
  preview: string;
  content: string;
  images: string[];
}

export interface Like {
  id: string;
  title: string;
  slug: string;
  published: string;
  url: string;
  content: string;
}

export type Combined = Post | Like;

export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${KIRBY_API_URL}/blog.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const posts = await response.json();

  // Filter out posts that are published in the future.
  const now = new Date();
  const published = posts.filter((post: Post) => {
    return new Date(post.published) <= now;
  });

  const hydrated = published.map((post: Post) => {
    // For each post, add a preview field.
    // If the post content has a '<div class="break"></div>' element, use the content up to (but not including) that element.
    // If there is no 'break', use the full content as the preview.
    const index = post.content.indexOf('<div class="break"></div>');
    post.preview = index === -1 ? post.content : post.content.slice(0, index);

    // For each post, generate a list of images.
    // Any string that matches the pattern 'https://files.george.black/*' is considered an image.
    const images = post.content.match(/https:\/\/files\.george\.black\/[^"]+/g);
    post.images = images || [];

    return post;
  });

  // Sort posts by published date, in descending order.
  return hydrated.sort((a: Post, b: Post) => {
    return a.published < b.published ? 1 : -1;
  });
}

export async function getLikes(): Promise<Like[]> {
  const response = await fetch(`${KIRBY_API_URL}/links.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const likes = await response.json();

  // Filter out any likes that are published in the future.
  const now = new Date();
  const published = likes.filter((like: Like) => {
    return new Date(like.published) <= now;
  });

  // Sort likes by published date, in descending order.
  return published.sort((a: Like, b: Like) => {
    return a.published < b.published ? 1 : -1;
  });
}

export async function getCombined(): Promise<Combined[]> {
  const posts = await getPosts();
  const likes = await getLikes();
  const combined = [...posts, ...likes];

  // Sort combined posts and likes by published date, in descending order.
  return combined.sort((a: Combined, b: Combined) => {
    return a.published < b.published ? 1 : -1;
  });
}
