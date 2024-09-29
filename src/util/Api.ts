const API_URL = import.meta.env.API_URL;
const API_TOKEN = import.meta.env.API_TOKEN;

export interface AuthResponse {
  token: string;
}

export interface PostsResponse {
  posts: Post[];
}

export interface Post {
  title: string;
  slug: string;
  published: string;
  listed: boolean;
  contentHtml: string;
  contentHtmlPreview?: string;
}

export interface LikeResponse {
  likes: Like[];
}

export interface Like {
  title: string;
  url: string;
  timestamp: string;
}

export async function getPosts(): Promise<Post[]> {
  const authResponse = await fetch(`${API_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_TOKEN,
    },
  });
  const auth: AuthResponse = await authResponse.json();

  const postsResponse = await fetch(`${API_URL}/posts?published=true`, {
    headers: {
      Authorization: "Bearer " + auth.token,
    },
  });
  const posts: PostsResponse = await postsResponse.json();

  return posts.posts;
}

export async function getLikes(): Promise<Like[]> {
  const authResponse = await fetch(`${API_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + API_TOKEN,
    },
  });
  const auth: AuthResponse = await authResponse.json();

  const likesResponse = await fetch(`${API_URL}/likes`, {
    headers: {
      Authorization: "Bearer " + auth.token,
    },
  });
  const likes: LikeResponse = await likesResponse.json();

  return likes.likes;
}
