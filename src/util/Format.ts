import type { Post } from "./Api";

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function hostnameFromUrl(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "");
}

export function fullSlug(post: Post): string {
  const year = new Date(post.published).getFullYear().toString();
  return `${year}/${post.slug}`;
}
