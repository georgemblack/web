import type { Combined, Like, Post } from "./Api";

export function slug(post: Post): string {
  const year = new Date(post.published).getFullYear().toString();
  return `${year}/${post.slug}`;
}

export function subtitle(item: Combined): string {
  if (isPost(item)) return timestamp(item.published);
  if (isLike(item))
    return `${hostname(item.url)} • ${timestamp(item.published)}`;
  return "";
}

export function url(item: Combined): string {
  if (isPost(item)) return `/${slug(item)}`;
  if (isLike(item)) return item.url;
  return "/";
}

export function preview(item: Combined): string {
  if (isPost(item)) return item.preview || item.content;
  if (isLike(item)) return item.content;
  return "";
}

export function readMore(item: Combined): boolean {
  if (isLike(item)) return false;
  if (isPost(item)) return item.content !== item.preview;
  return false;
}

export function timestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function hostname(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "");
}

export function isPost(item: Combined): item is Post {
  return item.id.startsWith("blog");
}

export function isLike(item: Combined): item is Like {
  return item.id.startsWith("link");
}
