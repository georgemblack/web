import { CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET } from "astro:env/server";

export interface Post {
  id: string;
  title: string;
  slug: string;
  published: string;
  link: string | null;
  visible: boolean;
  gallery: boolean;
  preview: string;
  content: string;
  images: string[];
}

export async function getPosts(): Promise<Post[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_ACCESS_CLIENT_SECRET;
  }

  const response = await fetch(`https://kirby.george.black/blog.json`, {
    method: "GET",
    headers,
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

    return post;
  });

  // Sort posts by published date, in descending order.
  return hydrated.sort((a: Post, b: Post) => {
    return a.published < b.published ? 1 : -1;
  });
}
