const API_URL = import.meta.env.API_URL;
const API_TOKEN = import.meta.env.API_TOKEN;

interface AuthResponse {
  token: string;
}

interface PostsResponse {
  posts: Post[];
}

export interface Post {
  title: string;
  slug: string;
  published: Timestamp;
  listed: boolean;
  contentHtml: string;
  contentHtmlPreview?: string;
}

interface LikeResponse {
  likes: Like[];
}

interface Like {
  title: string;
  url: string;
  timestamp: Timestamp;
}

interface Timestamp {
  _seconds: number;
  _nanoseconds: number;
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

  const postsResponse = await fetch(
    `${API_URL}/posts?listed=true&published=true`,
    {
      headers: {
        Authorization: "Bearer " + auth.token,
      },
    }
  );
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
