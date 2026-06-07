import { toHTML } from "@portabletext/to-html";
import type { PortableTextBlock } from "@portabletext/types";

import { CodeValue, ImageValue, VideoValue } from "./types";

function renderImage(value: ImageValue): string {
  const img = `<img src="/files/${value.key}" alt="${value.alt}">`;
  if (value.caption) {
    return `<figure>${img}<figcaption>${value.caption}</figcaption></figure>`;
  }
  return `<figure>${img}</figure>`;
}

function renderVideo(value: VideoValue): string {
  const attrs = [`src="/files/${value.key}"`, 'loading="lazy"', "playsinline"];
  if (value.controls) attrs.push("controls");
  if (value.autoplay) attrs.push("autoplay");
  if (value.muted) attrs.push("muted");
  if (value.loop) attrs.push("loop");
  const video = `<video ${attrs.join(" ")}></video>`;
  if (value.caption) {
    return `<figure>${video}<figcaption>${value.caption}</figcaption></figure>`;
  }
  return `<figure>${video}</figure>`;
}

function renderCode(value: CodeValue): string {
  return `<pre><code>${value.text}</code></pre>`;
}

function renderLine(): string {
  return "<hr>";
}

function renderBreak(): string {
  return '<div class="break"></div>';
}

const portableTextOptions = {
  components: {
    block: {
      blockquote: ({ children }: { children?: string }) =>
        `<blockquote><p>${children ?? ""}</p></blockquote>`,
    },
    marks: {
      code: ({ children }: { children: string }) => `<code>${children}</code>`,
    },
    types: {
      image: ({ value }: { value: unknown }) =>
        renderImage(value as ImageValue),
      video: ({ value }: { value: unknown }) =>
        renderVideo(value as VideoValue),
      code: ({ value }: { value: unknown }) => renderCode(value as CodeValue),
      line: () => renderLine(),
      break: () => renderBreak(),
    },
  },
};

export function render(blocks: PortableTextBlock[]): string {
  return toHTML(blocks, portableTextOptions);
}

export function renderPreview(blocks: PortableTextBlock[]): string | null {
  if (blocks.length === 0) {
    return null;
  }
  const breakIndex = blocks.findIndex((block) => block._type === "break");
  if (breakIndex === -1) {
    return null;
  }
  const previewBlocks = blocks.slice(0, breakIndex);
  if (previewBlocks.length === 0) {
    return null;
  }
  return toHTML(previewBlocks, portableTextOptions);
}
