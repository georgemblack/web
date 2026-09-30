import { Breadcrumbs, Button, Text } from "@cloudflare/kumo";
import {
  defineAnnotation,
  defineBlockObject,
  defineDecorator,
  defineSchema,
  defineTextBlock,
  EditorProvider,
  PortableTextEditable,
} from "@portabletext/editor";
import type {
  BlockObjectRenderProps,
  PortableTextBlock,
  TextBlockRenderProps,
} from "@portabletext/editor";
import { defineBehavior } from "@portabletext/editor/behaviors";
import { BehaviorPlugin, EventListenerPlugin, NodePlugin } from "@portabletext/editor/plugins";
import { ListIndexProvider, useListIndex } from "@portabletext/plugin-list-index";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";

import PaddedSurface from "@/components/PaddedSurface";
import { CodeBlockObjectEditor } from "@/components/editor/CodeBlockObjectEditor";
import { FilesContext } from "@/components/editor/FilesContext";
import { ImageBlockObjectEditor } from "@/components/editor/ImageBlockObjectEditor";
import { MetadataSection } from "@/components/editor/MetadataSection";
import { Toolbar } from "@/components/editor/Toolbar";
import { VideoBlockObjectEditor } from "@/components/editor/VideoBlockObjectEditor";
import { getPost, updatePost } from "@/data/db";
import { listFiles } from "@/data/files";
import type { Post, PostStatus, WebFile } from "@/data/types";

export const Route = createFileRoute("/posts/$postId")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId });
    if (!post) throw new Error("Post not found");
    const postYear = new Date(post.published).getFullYear();
    const files = await listFiles({ data: { year: postYear } });
    return { post, files };
  },
});

const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }, { name: "code" }],
  styles: [{ name: "normal" }, { name: "h2" }, { name: "h3" }, { name: "blockquote" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  lists: [{ name: "bullet" }, { name: "number" }],
  inlineObjects: [],
  blockObjects: [
    {
      name: "image",
      fields: [
        { name: "key", type: "string" },
        { name: "alt", type: "string" },
        { name: "caption", type: "string" },
      ],
    },
    {
      name: "video",
      fields: [
        { name: "key", type: "string" },
        { name: "caption", type: "string" },
        { name: "controls", type: "boolean" },
        { name: "autoplay", type: "boolean" },
        { name: "muted", type: "boolean" },
        { name: "loop", type: "boolean" },
      ],
    },
    { name: "line" },
    { name: "break" },
    {
      name: "code",
      fields: [{ name: "text", type: "string" }],
    },
  ],
});

const convertSoftBreakToBreak = defineBehavior({
  on: "insert.soft break",
  actions: [() => [{ type: "execute", event: { type: "insert.break" } }]],
});

// Wraps a block object's editing UI in the markup the editor expects:
// the outer element carries the editor's attributes and children, while
// the visible content is non-editable and can be dragged to move the block.
// Blocks with text fields turn dragging off so text inside them can be selected.
function renderBlockObject(content: ReactNode, { draggable = true } = {}) {
  return ({ attributes, children, readOnly }: BlockObjectRenderProps) => (
    <div {...attributes}>
      <div contentEditable={false} draggable={draggable && !readOnly}>
        {content}
      </div>
      {children}
    </div>
  );
}

function TextBlock({ attributes, children, node, path }: TextBlockRenderProps) {
  const listIndex = useListIndex(path);

  let content: ReactNode;
  switch (node.style) {
    case "h2":
      content = <h2 className="text-xl font-bold">{children}</h2>;
      break;
    case "h3":
      content = <h3 className="text-lg font-semibold">{children}</h3>;
      break;
    case "blockquote":
      content = (
        <blockquote className="border-l-4 border-gray-300 pl-4 text-gray-600 italic">
          {children}
        </blockquote>
      );
      break;
    default:
      content = <p>{children}</p>;
  }

  if (node.listItem) {
    const marker = node.listItem === "number" ? `${listIndex ?? 1}.` : "•";
    return (
      <div
        {...attributes}
        data-list-item
        className="flex gap-2"
        style={{ paddingLeft: `${(node.level ?? 1) * 1.5}rem` }}
      >
        <span contentEditable={false} className="min-w-4 text-right select-none">
          {marker}
        </span>
        <div className="flex-1">{content}</div>
      </div>
    );
  }

  return <div {...attributes}>{content}</div>;
}

const nodes = [
  defineTextBlock({ type: "block", render: (props) => <TextBlock {...props} /> }),
  defineBlockObject({
    type: "image",
    render: (props) =>
      renderBlockObject(<ImageBlockObjectEditor value={props.node} path={props.path} />)(props),
  }),
  defineBlockObject({
    type: "video",
    render: (props) =>
      renderBlockObject(<VideoBlockObjectEditor value={props.node} path={props.path} />)(props),
  }),
  defineBlockObject({
    type: "code",
    render: (props) =>
      renderBlockObject(<CodeBlockObjectEditor value={props.node} path={props.path} />, {
        draggable: false,
      })(props),
  }),
  defineBlockObject({
    type: "line",
    render: renderBlockObject(
      <div className="my-2 rounded bg-gray-100 py-1 text-center text-sm text-gray-500">Line</div>,
    ),
  }),
  defineBlockObject({
    type: "break",
    render: renderBlockObject(
      <div className="my-2 rounded bg-gray-100 py-1 text-center text-sm text-gray-500">
        Preview break
      </div>,
    ),
  }),
  defineDecorator({ type: "strong", render: ({ children }) => <strong>{children}</strong> }),
  defineDecorator({ type: "em", render: ({ children }) => <em>{children}</em> }),
  defineDecorator({ type: "underline", render: ({ children }) => <u>{children}</u> }),
  defineDecorator({ type: "code", render: ({ children }) => <code>{children}</code> }),
  defineAnnotation({
    type: "link",
    render: ({ children }) => <span className="text-blue-600 underline">{children}</span>,
  }),
];

function RouteComponent() {
  const { post, files } = Route.useLoaderData();

  if (!post) {
    return <span>Post not found</span>;
  }

  return <PostEditor key={post.published} post={post} files={files} />;
}

interface PostEditorProps {
  post: Post;
  files: WebFile[];
}

function PostEditor({ post, files }: PostEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title === "Untitled" ? "" : post.title);
  const [published, setPublished] = useState(post.published);
  const [slug, setSlug] = useState(post.slug);
  const [status, setStatus] = useState<PostStatus>(post.status as PostStatus);
  const [hidden, setHidden] = useState(post.hidden);
  const [gallery, setGallery] = useState(post.gallery);
  const [externalLink, setExternalLink] = useState<string | null>(post.external_link);
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

  const handleMutation = useCallback((event: { type: string; value?: PortableTextBlock[] }) => {
    if (event.type === "mutation" && event.value) {
      setPtValue(event.value);
    }
  }, []);

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
            <Breadcrumbs.Current>{title || "Untitled"}</Breadcrumbs.Current>
          </Breadcrumbs>
        </div>
        <div className="flex items-center gap-4">
          {statusMessage === "error" && <Text variant="secondary">Error saving post</Text>}
          {!statusMessage && isDirty && <Text variant="secondary">Unsaved changes</Text>}
          <Button variant="primary" onClick={handleSave} loading={isSaving} disabled={!isDirty}>
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
          <FilesContext.Provider value={files}>
            <EditorProvider
              initialConfig={{
                schemaDefinition,
                initialValue: ptValue.length > 0 ? ptValue : undefined,
              }}
            >
              <EventListenerPlugin on={handleMutation} />
              <BehaviorPlugin behaviors={[convertSoftBreakToBreak]} />
              <NodePlugin nodes={nodes} />
              <Toolbar />
              <ListIndexProvider>
                <PortableTextEditable className="min-h-64 [&>*+*]:mt-4 [&>[data-list-item]+[data-list-item]]:mt-1" />
              </ListIndexProvider>
            </EditorProvider>
          </FilesContext.Provider>
        </PaddedSurface>
      </div>
    </>
  );
}
