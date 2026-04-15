import type { PortableTextBlock } from "@portabletext/editor";

export interface VideoValue {
  key: string;
  caption?: string;
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export function readVideoValue(value: PortableTextBlock): VideoValue {
  const v = value as Record<string, unknown>;
  return {
    key: (v.key as string | undefined) ?? "",
    caption: v.caption as string | undefined,
    controls: v.controls as boolean | undefined,
    autoplay: v.autoplay as boolean | undefined,
    muted: v.muted as boolean | undefined,
    loop: v.loop as boolean | undefined,
  };
}
