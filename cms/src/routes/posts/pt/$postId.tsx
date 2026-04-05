import { Breadcrumbs, Button, Input, Switch, Text } from "@cloudflare/kumo";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
} from "@portabletext/editor";
import type { PortableTextBlock } from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import {
  useDecoratorButton,
  useListButton,
  useStyleSelector,
  useToolbarSchema,
} from "@portabletext/toolbar";
import type {
  ToolbarDecoratorSchemaType,
  ToolbarListSchemaType,
  ToolbarStyleSchemaType,
} from "@portabletext/toolbar";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import PaddedSurface from "@/components/PaddedSurface";
import { getPost, updatePost } from "@/data/db";
import type { Post, PostStatus } from "@/data/types";

export const Route = createFileRoute("/posts/pt/$postId")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId });
    if (!post) throw new Error("Post not found");
    return { post };
  },
});

// Emoji constants
const EMOJI = {
  draft: "\uD83D\uDCDD", // Memo
  published: "\uD83D\uDE80", // Rocket
  hidden: "\uD83E\uDEE3", // Face with peeking eye
  visible: "\uD83D\uDC40", // Eyes
  gallery: "\uD83D\uDDBC\uFE0F", // Framed picture
};

const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }],
  styles: [
    { name: "normal" },
    { name: "h1" },
    { name: "h2" },
    { name: "h3" },
    { name: "h4" },
    { name: "blockquote" },
  ],
  annotations: [{ name: "link" }],
  lists: [{ name: "bullet" }, { name: "number" }],
  inlineObjects: [],
  blockObjects: [],
});

const DECORATOR_LABELS: Record<string, string> = {
  strong: "B",
  em: "I",
  underline: "U",
};

const LIST_LABELS: Record<string, string> = {
  bullet: "UL",
  number: "OL",
};

function DecoratorButton({
  schemaType,
}: {
  schemaType: ToolbarDecoratorSchemaType;
}) {
  const button = useDecoratorButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  return (
    <button
      type="button"
      className={`rounded px-2 py-1 text-sm ${isActive ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}`}
      onClick={() => button.send({ type: "toggle" })}
    >
      {DECORATOR_LABELS[schemaType.name] ?? schemaType.name}
    </button>
  );
}

function ListToggleButton({
  schemaType,
}: {
  schemaType: ToolbarListSchemaType;
}) {
  const button = useListButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  return (
    <button
      type="button"
      className={`rounded px-2 py-1 text-sm ${isActive ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-700"}`}
      onClick={() => button.send({ type: "toggle" })}
    >
      {LIST_LABELS[schemaType.name] ?? schemaType.name}
    </button>
  );
}

function StyleSelect({
  schemaTypes,
}: {
  schemaTypes: ReadonlyArray<ToolbarStyleSchemaType>;
}) {
  const selector = useStyleSelector({ schemaTypes });
  return (
    <select
      className="rounded border border-gray-300 px-2 py-1 text-sm"
      value={selector.snapshot.context.activeStyle ?? "normal"}
      onChange={(e) => selector.send({ type: "toggle", style: e.target.value })}
    >
      {schemaTypes.map((style) => (
        <option key={style.name} value={style.name}>
          {style.name}
        </option>
      ))}
    </select>
  );
}

function Toolbar() {
  const schema = useToolbarSchema({});
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
      {schema.styles && <StyleSelect schemaTypes={schema.styles} />}
      {schema.decorators?.map((dec) => (
        <DecoratorButton key={dec.name} schemaType={dec} />
      ))}
      {schema.lists?.map((list) => (
        <ListToggleButton key={list.name} schemaType={list} />
      ))}
    </div>
  );
}

interface MetadataSectionProps {
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

function MetadataSection({
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
  // Convert ISO string to datetime-local format
  const toDatetimeLocal = (isoString: string): string => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Convert datetime-local to ISO string
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

function RouteComponent() {
  const { post } = Route.useLoaderData();

  if (!post) {
    return <span>Post not found</span>;
  }

  return <PortableTextPostEditor key={post.published} post={post} />;
}

interface PortableTextPostEditorProps {
  post: Post;
}

function PortableTextPostEditor({ post }: PortableTextPostEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(
    post.title === "Untitled" ? "" : post.title,
  );
  const [published, setPublished] = useState(post.published);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState<PostStatus>(post.status as PostStatus);
  const [hidden, setHidden] = useState(post.hidden);
  const [gallery, setGallery] = useState(post.gallery);
  const [externalLink, setExternalLink] = useState<string | null>(
    post.external_link,
  );
  const [ptValue, setPtValue] = useState<PortableTextBlock[]>(
    () => (post.content as PortableTextBlock[]) ?? [],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<"error" | null>(null);

  const isDirty =
    title !== post.title ||
    published !== post.published ||
    slug !== post.slug ||
    status !== post.status ||
    hidden !== post.hidden ||
    gallery !== post.gallery ||
    externalLink !== post.external_link ||
    JSON.stringify(ptValue) !== JSON.stringify(post.content);

  const handleMetadataChange = (field: string, value: string | null) => {
    switch (field) {
      case "title":
        setTitle(value ?? "");
        break;
      case "published":
        setPublished(value ?? new Date().toISOString());
        break;
      case "slug":
        setSlug(value ?? "");
        break;
      case "status":
        setStatus((value ?? "draft") as PostStatus);
        break;
      case "externalLink":
        setExternalLink(value);
        break;
    }
  };

  const handleMutation = useCallback(
    (event: { type: string; value?: PortableTextBlock[] }) => {
      if (event.type === "mutation" && event.value) {
        setPtValue(event.value);
      }
    },
    [],
  );

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const result = await updatePost({
        data: {
          id: post.id,
          title,
          published,
          slug,
          status,
          hidden,
          gallery,
          external_link: externalLink,
          portable_text: true,
          content: ptValue,
        },
      });

      if (result) {
        await router.invalidate();
      } else {
        console.error("Failed to save post. The post may have been deleted.");
        setStatusMessage("error");
      }
    } catch (err) {
      console.error("Error saving post:", err);
      setStatusMessage("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs>
            <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
            <Breadcrumbs.Separator />
            <Breadcrumbs.Current>
              {title || "Untitled"} (PT)
            </Breadcrumbs.Current>
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-4">
          {statusMessage === "error" && (
            <Text variant="secondary">Error saving post</Text>
          )}
          {!statusMessage && isDirty && (
            <Text variant="secondary">Unsaved changes</Text>
          )}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={isSaving}
            disabled={!isDirty}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <MetadataSection
          title={title}
          published={published}
          slug={slug}
          status={status}
          hidden={hidden}
          gallery={gallery}
          externalLink={externalLink}
          onChange={handleMetadataChange}
          onHiddenChange={setHidden}
          onGalleryChange={setGallery}
        />
      </div>

      <div className="mt-6">
        <PaddedSurface>
          <EditorProvider
            initialConfig={{
              schemaDefinition,
              initialValue: ptValue.length > 0 ? ptValue : undefined,
            }}
          >
            <EventListenerPlugin on={handleMutation} />
            <Toolbar />
            <PortableTextEditable className="min-h-64 focus:outline-none" />
          </EditorProvider>
        </PaddedSurface>
      </div>
    </>
  );
}
