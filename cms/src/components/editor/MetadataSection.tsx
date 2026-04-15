import { Button, Input, Switch, Text } from "@cloudflare/kumo";

import PaddedSurface from "@/components/PaddedSurface";
import type { PostStatus } from "@/data/types";

const EMOJI = {
  draft: "\uD83D\uDCDD", // Memo
  published: "\uD83D\uDE80", // Rocket
  hidden: "\uD83E\uDEE3", // Face with peeking eye
  visible: "\uD83D\uDC40", // Eyes
  gallery: "\uD83D\uDDBC\uFE0F", // Framed picture
};

export interface MetadataSectionProps {
  title: string;
  published: string;
  slug: string;
  status: PostStatus;
  hidden: boolean;
  gallery: boolean;
  externalLink: string | null;
  onChange: (field: string, value: string | null) => void;
  onHiddenChange: (hidden: boolean) => void;
  onGalleryChange: (gallery: boolean) => void;
}

export function MetadataSection({
  title,
  published,
  slug,
  status,
  hidden,
  gallery,
  externalLink,
  onChange,
  onHiddenChange,
  onGalleryChange,
}: MetadataSectionProps) {
  const toDatetimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const toISOString = (datetimeLocal: string): string => {
    return new Date(datetimeLocal).toISOString();
  };

  return (
    <PaddedSurface>
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex gap-3">
            <Input
              className="w-full"
              value={title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="Title"
              aria-label="Title"
            />
            <Button
              variant="secondary"
              aria-label="Generate slug from title"
              onClick={() => {
                const generated = title
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-")
                  .replace(/-+/g, "-")
                  .replace(/^-|-$/g, "");
                onChange("slug", generated);
              }}
            >
              Slug
            </Button>
          </div>
          <div className="mt-1 ml-1">
            <Text variant="secondary">{slug}</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <Input
            className="w-full"
            type="datetime-local"
            value={toDatetimeLocal(published)}
            onChange={(e) => onChange("published", toISOString(e.target.value))}
            aria-label="Published date"
          />
          <Button
            variant="secondary"
            aria-label="Set published date to now"
            onClick={() => {
              onChange("published", new Date().toISOString());
            }}
          >
            Now
          </Button>
        </div>
        <Input
          type="url"
          value={externalLink ?? ""}
          onChange={(e) => onChange("externalLink", e.target.value || null)}
          placeholder="https://example.com"
          aria-label="External link"
        />
        <div className="flex gap-3">
          <Switch
            label={status === "published" ? EMOJI.published : EMOJI.draft}
            checked={status === "published"}
            onCheckedChange={(checked) =>
              onChange("status", checked ? "published" : "draft")
            }
          />
          <Switch
            label={hidden ? EMOJI.hidden : EMOJI.visible}
            checked={hidden}
            onCheckedChange={onHiddenChange}
          />
          <Switch
            label={EMOJI.gallery}
            checked={gallery}
            onCheckedChange={onGalleryChange}
          />
        </div>
      </div>
    </PaddedSurface>
  );
}
