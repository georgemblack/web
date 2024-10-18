const API_URL = import.meta.env.KIRBY_API_URL;

export interface Post {
  id: string;
  title: string;
  slug: string;
  published: string;
  visible: boolean;
  preview: string;
  content: string;
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
  const response = await fetch(`${API_URL}/blog.json`, {
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

  // For each post, add a preview field.
  // If the post content has a '<div class="break"></div>' element, use the content up to (but not including) that element.
  // If there is no 'break', use the full content as the preview.
  const hydrated = published.map((post: Post) => {
    const index = post.content.indexOf('<div class="break"></div>');
    post.preview = index === -1 ? post.content : post.content.slice(0, index);
    return post;
  });

  // Sort posts by published date, in descending order.
  return hydrated.sort((a: Post, b: Post) => {
    return a.published < b.published ? 1 : -1;
  });
}

export async function getLikes(): Promise<Like[]> {
  const response = await fetch(`${API_URL}/links.json`, {
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
  const sorted = combined.sort((a: Combined, b: Combined) => {
    return a.published < b.published ? 1 : -1;
  });

  //  Keep 20 latest items
  return sorted.slice(0, 20);
}
