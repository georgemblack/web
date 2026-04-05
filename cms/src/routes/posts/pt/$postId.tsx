import {
  Breadcrumbs,
  Button,
  Input,
  Popover,
  Select,
  Switch,
  Text,
} from "@cloudflare/kumo";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
} from "@portabletext/editor";
import type {
  PortableTextBlock,
  RenderAnnotationFunction,
  RenderDecoratorFunction,
  RenderListItemFunction,
  RenderStyleFunction,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import {
  useAnnotationButton,
  useDecoratorButton,
  useListButton,
  useStyleSelector,
  useToolbarSchema,
} from "@portabletext/toolbar";
import type {
  ToolbarAnnotationSchemaType,
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
    { name: "h2" },
    { name: "h3" },
    { name: "blockquote" },
  ],
  annotations: [{ name: "link" }],
  lists: [{ name: "bullet" }, { name: "number" }],
  inlineObjects: [],
  blockObjects: [],
});

const renderStyle: RenderStyleFunction = (props) => {
  const tag = props.schemaType.value;
  switch (tag) {
    case "h2":
      return <h2 className="text-xl font-bold">{props.children}</h2>;
    case "h3":
      return <h3 className="text-lg font-semibold">{props.children}</h3>;
    case "blockquote":
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 text-gray-600 italic">
          {props.children}
        </blockquote>
      );
    default:
      return <p>{props.children}</p>;
  }
};

const renderDecorator: RenderDecoratorFunction = (props) => {
  switch (props.value) {
    case "strong":
      return <strong>{props.children}</strong>;
    case "em":
      return <em>{props.children}</em>;
    case "underline":
      return <u>{props.children}</u>;
    default:
      return <>{props.children}</>;
  }
};

const renderAnnotation: RenderAnnotationFunction = (props) => {
  if (props.schemaType.name === "link") {
    return <span className="text-blue-600 underline">{props.children}</span>;
  }
  return <>{props.children}</>;
};

const renderListItem: RenderListItemFunction = (props) => {
  return <li className="ml-6">{props.children}</li>;
};

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
    <Button
      variant={isActive ? "primary" : "ghost"}
      onClick={() => button.send({ type: "toggle" })}
    >
      {DECORATOR_LABELS[schemaType.name] ?? schemaType.name}
    </Button>
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
    <Button
      variant={isActive ? "primary" : "ghost"}
      onClick={() => button.send({ type: "toggle" })}
    >
      {LIST_LABELS[schemaType.name] ?? schemaType.name}
    </Button>
  );
}

function LinkButton({
  schemaType,
}: {
  schemaType: ToolbarAnnotationSchemaType;
}) {
  const button = useAnnotationButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  const isShowingDialog = button.snapshot.matches({
    enabled: { inactive: "showing dialog" },
  });
  const [href, setHref] = useState("");

  return (
    <Popover
      open={isShowingDialog}
      onOpenChange={(open) => {
        if (!open) {
          button.send({ type: "close dialog" });
          setHref("");
        }
      }}
    >
      <Popover.Trigger asChild>
        <Button
          variant={isActive ? "primary" : "ghost"}
          onClick={() => {
            if (isActive) {
              button.send({ type: "remove" });
            } else {
              button.send({ type: "open dialog" });
            }
          }}
        >
          Link
        </Button>
      </Popover.Trigger>
      <Popover.Content side="bottom" align="start">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (href) {
              button.send({
                type: "add",
                annotation: { value: { href } },
              });
              setHref("");
            }
          }}
        >
          <Input
            aria-label="URL"
            placeholder="https://..."
            value={href}
            onChange={(e) => setHref(e.target.value)}
          />
          <Button variant="primary" type="submit">
            Add
          </Button>
        </form>
      </Popover.Content>
    </Popover>
  );
}

function StyleSelect({
  schemaTypes,
}: {
  schemaTypes: ReadonlyArray<ToolbarStyleSchemaType>;
}) {
  const selector = useStyleSelector({ schemaTypes });
  return (
    <Select
      aria-label="Block style"
      value={selector.snapshot.context.activeStyle ?? "normal"}
      onValueChange={(value) =>
        selector.send({ type: "toggle", style: value as string })
      }
    >
      {schemaTypes.map((style) => (
        <Select.Option key={style.name} value={style.name}>
          {style.name}
        </Select.Option>
      ))}
    </Select>
  );
}

function Toolbar() {
  const schema = useToolbarSchema({});
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {schema.decorators?.map((dec) => (
          <DecoratorButton key={dec.name} schemaType={dec} />
        ))}
        {schema.lists?.map((list) => (
          <ListToggleButton key={list.name} schemaType={list} />
        ))}
        {schema.annotations?.map((ann) => (
          <LinkButton key={ann.name} schemaType={ann} />
        ))}
      </div>
      <div>{schema.styles && <StyleSelect schemaTypes={schema.styles} />}</div>
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
            <PortableTextEditable
              className="min-h-64 [&_ol]:list-decimal [&_ul]:list-disc"
              renderStyle={renderStyle}
              renderDecorator={renderDecorator}
              renderAnnotation={renderAnnotation}
              renderListItem={renderListItem}
            />
          </EditorProvider>
        </PaddedSurface>
      </div>
    </>
  );
}
