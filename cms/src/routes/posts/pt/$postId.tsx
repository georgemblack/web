import {
  Breadcrumbs,
  Button,
  Input,
  Dialog,
  Select,
  Switch,
  Text,
} from "@cloudflare/kumo";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
} from "@portabletext/editor";
import type {
  BlockPath,
  PortableTextBlock,
  RenderAnnotationFunction,
  RenderBlockFunction,
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
import { createContext, useCallback, useContext, useState } from "react";

import PaddedSurface from "@/components/PaddedSurface";
import { getPost, updatePost } from "@/data/db";
import { listFiles } from "@/data/files";
import type { Post, PostStatus } from "@/data/types";

export const Route = createFileRoute("/posts/pt/$postId")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId });
    if (!post) throw new Error("Post not found");
    const postYear = new Date(post.published).getFullYear();
    const files = await listFiles({ data: postYear });
    const fileNames = files.map((f) => f.key);
    return { post, fileNames };
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
  blockObjects: [
    { name: "image" },
    { name: "line" },
    { name: "break" },
    { name: "code" },
  ],
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

const FileNamesContext = createContext<string[]>([]);

function ImageBlockObjectEditor({
  value,
  path,
}: {
  value: PortableTextBlock;
  path: BlockPath;
}) {
  const editor = useEditor();
  const fileNames = useContext(FileNamesContext);
  const key = (value as Record<string, unknown>).key as string | undefined;
  const alt = (value as Record<string, unknown>).alt as string | undefined;
  const caption = (value as Record<string, unknown>).caption as
    | string
    | undefined;

  const update = (props: Record<string, unknown>) => {
    editor.send({ type: "block.set", at: path, props });
  };

  return (
    <div
      contentEditable={false}
      className="my-2 flex flex-col gap-2 rounded border border-gray-200 p-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-gray-300 bg-gray-100">
          {key && (
            <img
              src={`https://george.black/files/${key}`}
              alt={alt || "Preview"}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-1 gap-2">
          <Input
            className="flex-1"
            value={key ?? ""}
            onChange={(e) => update({ key: e.target.value })}
            placeholder="picture.jpg"
            aria-label="Image key"
          />
          {fileNames.length > 0 && (
            <Select
              className="w-48"
              value=""
              onValueChange={(fileName) => {
                if (fileName) update({ key: fileName });
              }}
              placeholder="Select file..."
            >
              {fileNames.map((fileName) => (
                <Select.Option key={fileName} value={fileName}>
                  {fileName}
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          className="flex-1"
          value={alt ?? ""}
          onChange={(e) => update({ alt: e.target.value })}
          placeholder="Alt text"
          aria-label="Alt text"
        />
        <Input
          className="flex-1"
          value={caption ?? ""}
          onChange={(e) => update({ caption: e.target.value || undefined })}
          placeholder="Caption"
          aria-label="Caption"
        />
      </div>
    </div>
  );
}

function CodeBlockObjectEditor({
  value,
  path,
}: {
  value: PortableTextBlock;
  path: BlockPath;
}) {
  const editor = useEditor();
  const text = (value as Record<string, unknown>).text as string | undefined;

  return (
    <div contentEditable={false} className="my-2">
      <textarea
        className="w-full rounded border border-gray-200 bg-gray-50 p-3 font-mono text-sm"
        value={text ?? ""}
        onChange={(e) =>
          editor.send({
            type: "block.set",
            at: path,
            props: { text: e.target.value },
          })
        }
        rows={6}
        placeholder="Code..."
      />
    </div>
  );
}

const renderBlock: RenderBlockFunction = (props) => {
  switch (props.schemaType.name) {
    case "image":
      return <ImageBlockObjectEditor value={props.value} path={props.path} />;
    case "line":
      return <hr className="my-4 border-gray-300" />;
    case "break":
      return (
        <div className="my-2 rounded bg-gray-100 py-1 text-center text-sm text-gray-500">
          Preview break
        </div>
      );
    case "code":
      return <CodeBlockObjectEditor value={props.value} path={props.path} />;
    default:
      return <div>{props.children}</div>;
  }
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
    <>
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
        🔗
      </Button>
      <Dialog.Root
        open={isShowingDialog}
        onOpenChange={(open) => {
          if (!open) {
            button.send({ type: "close dialog" });
            setHref("");
          }
        }}
      >
        <Dialog className="p-8" size="sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-2xl font-semibold">
              Add Link
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              render={(props) => (
                <Button {...props} variant="secondary" aria-label="Close">
                  ✕
                </Button>
              )}
            />
          </div>
          <form
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
              autoFocus
            />
            <div className="mt-8 flex justify-end gap-2">
              <Dialog.Close
                render={(props) => (
                  <Button {...props} variant="secondary">
                    Cancel
                  </Button>
                )}
              />
              <Button variant="primary" type="submit">
                Add
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>
    </>
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

function BlockObjectInsertButton({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: Record<string, unknown>;
}) {
  const editor = useEditor();
  return (
    <Button
      variant="ghost"
      onClick={() =>
        editor.send({
          type: "insert.block object",
          blockObject: {
            name,
            value: defaultValue ?? {},
          },
          placement: "auto",
        })
      }
    >
      {label}
    </Button>
  );
}

function Toolbar() {
  const schema = useToolbarSchema({});
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {schema.annotations?.map((ann) => (
            <LinkButton key={ann.name} schemaType={ann} />
          ))}
          <BlockObjectInsertButton
            name="image"
            label="🖼️"
            defaultValue={{ key: "", alt: "" }}
          />
          <BlockObjectInsertButton
            name="code"
            label="💻"
            defaultValue={{ text: "" }}
          />
          <BlockObjectInsertButton name="line" label="➖" />
          <BlockObjectInsertButton name="break" label="✂️" />
        </div>
        <div>
          {schema.styles && <StyleSelect schemaTypes={schema.styles} />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {schema.decorators?.map((dec) => (
          <DecoratorButton key={dec.name} schemaType={dec} />
        ))}
        {schema.lists?.map((list) => (
          <ListToggleButton key={list.name} schemaType={list} />
        ))}
      </div>
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
  const { post, fileNames } = Route.useLoaderData();

  if (!post) {
    return <span>Post not found</span>;
  }

  return (
    <PortableTextPostEditor
      key={post.published}
      post={post}
      fileNames={fileNames}
    />
  );
}

interface PortableTextPostEditorProps {
  post: Post;
  fileNames: string[];
}

function PortableTextPostEditor({
  post,
  fileNames,
}: PortableTextPostEditorProps) {
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
          <FileNamesContext.Provider value={fileNames}>
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
                renderBlock={renderBlock}
                renderDecorator={renderDecorator}
                renderAnnotation={renderAnnotation}
                renderListItem={renderListItem}
              />
            </EditorProvider>
          </FileNamesContext.Provider>
        </PaddedSurface>
      </div>
    </>
  );
}
