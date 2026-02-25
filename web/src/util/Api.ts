import { CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET } from "astro:env/server";

export type PostStatus = "draft" | "published";

export interface Post {
  id: string;
  title: string;
  published: string;
  updated: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  external_link: string | null;
  content_html: string;
  preview_html: string | null;
  images: string[];
}

export interface ListItem {
  id: string;
  title: string;
  published: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
}

export async function getPosts(): Promise<Post[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_ACCESS_CLIENT_SECRET;
  }
  const response = await fetch(`https://cms.george.black/api/posts`, {
    method: "GET",
    headers,
  });

  const posts: ListItem[] = await response.json();
  const published = posts.filter((post) => post.status === "published");

  // Fetch the contents of each post that is published & visible
  const rendered: Post[] = [];
  for (const item of published) {
    const response = await fetch(
      `https://cms.george.black/api/posts/${item.id}/rendered`,
      {
        method: "GET",
        headers,
      },
    );
    rendered.push(await response.json());
  }

  // Sort posts by published date, in descending order
  return rendered.sort((a: Post, b: Post) => {
    return a.published < b.published ? 1 : -1;
  });
}
