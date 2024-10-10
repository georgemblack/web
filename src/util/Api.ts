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

export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${API_URL}/blog.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const posts = await response.json();

  // For each post, add a preview field.
  // If the post content has a '<div class="break"></div>' element, use the content up to (but not including) that element.
  // If there is no 'break', use the full content as the preview.
  return posts.map((post: Post) => {
    const index = post.content.indexOf('<div class="break"></div>');
    post.preview = index === -1 ? post.content : post.content.slice(0, index);
    return post;
  });
}

export async function getLikes(): Promise<Like[]> {
  const response = await fetch(`${API_URL}/links.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}
