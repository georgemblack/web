import type { Post } from "./Api";

export function slug(item: Post): string {
  const year = new Date(item.published).getFullYear().toString();
  return `${year}/${item.slug}`;
}

export function subtitle(item: Post): string {
  if (item.external_link)
    return `${hostname(item.external_link)} • ${timestamp(item.published)}`;
  return timestamp(item.published);
}

export function url(item: Post): string {
  if (item.external_link) return item.external_link;
  return `/${slug(item)}`;
}

export function absoluteUrl(item: Post): string {
  if (item.external_link) return item.external_link;
  return `https://george.black/${slug(item)}`;
}

export function preview(item: Post): string {
  return item.preview_html || item.content_html || "";
}

export function image(item: Post): string {
  return item.images[0] || "";
}

export function images(item: Post): string[] {
  return item.images.slice(0, 6);
}

export function readMore(item: Post): boolean {
  if (item.external_link) return false;
  return item.content_html !== item.preview_html;
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
