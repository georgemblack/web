const API_URL = import.meta.env.API_URL;

export interface Post {
  title: string;
  slug: string;
  published: string;
  visible: boolean;
  preview: string;
  content: string;
}

export interface Like {
  title: string;
  url: string;
  published: string;
}

export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${API_URL}/blog.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function getLikes(): Promise<Like[]> {
  const response = await fetch(`${API_URL}/likes.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}
