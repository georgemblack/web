import type { PortableTextBlock } from "@portabletext/editor";

export interface ImageValue {
  key: string;
  alt: string;
  caption?: string;
}

export function readImageValue(value: PortableTextBlock): ImageValue {
  const v = value as Record<string, unknown>;
  return {
    key: (v.key as string | undefined) ?? "",
    alt: (v.alt as string | undefined) ?? "",
    caption: v.caption as string | undefined,
  };
}
