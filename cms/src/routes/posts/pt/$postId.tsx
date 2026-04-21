import { Breadcrumbs, Button, Text } from "@cloudflare/kumo";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
} from "@portabletext/editor";
import type {
  PortableTextBlock,
  RenderAnnotationFunction,
  RenderBlockFunction,
  RenderDecoratorFunction,
  RenderListItemFunction,
  RenderStyleFunction,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";

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

export const Route = createFileRoute("/posts/pt/$postId")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async ({ params }) => {
    const post = await getPost({
      data: { id: params.postId, format: "pt" },
    });
    if (!post) throw new Error("Post not found");
    const postYear = new Date(post.published).getFullYear();
    const files = await listFiles({ data: { year: postYear } });
    return { post, files };
  },
});

const schemaDefinition = defineSchema({
  decorators: [
    { name: "strong" },
    { name: "em" },
    { name: "underline" },
    { name: "code" },
  ],
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
    case "code":
      return <code>{props.children}</code>;
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

const renderBlock: RenderBlockFunction = (props) => {
  switch (props.schemaType.name) {
    case "image":
      return <ImageBlockObjectEditor value={props.value} path={props.path} />;
    case "video":
      return <VideoBlockObjectEditor value={props.value} path={props.path} />;
    case "line":
      return (
        <div className="my-2 rounded bg-gray-100 py-1 text-center text-sm text-gray-500">
          Line
        </div>
      );
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

function RouteComponent() {
  const { post, files } = Route.useLoaderData();

  if (!post) {
    return <span>Post not found</span>;
  }

  return (
    <PortableTextPostEditor key={post.published} post={post} files={files} />
  );
}

interface PortableTextPostEditorProps {
  post: Post;
  files: WebFile[];
}

function PortableTextPostEditor({ post, files }: PortableTextPostEditorProps) {
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
          <FilesContext.Provider value={files}>
            <EditorProvider
              initialConfig={{
                schemaDefinition,
                initialValue: ptValue.length > 0 ? ptValue : undefined,
              }}
            >
              <EventListenerPlugin on={handleMutation} />
              <Toolbar />
              <PortableTextEditable
                className="min-h-64 [&_ol]:list-decimal [&_ul]:list-disc [&>*+*]:mt-4"
                renderStyle={renderStyle}
                renderBlock={renderBlock}
                renderDecorator={renderDecorator}
                renderAnnotation={renderAnnotation}
                renderListItem={renderListItem}
              />
            </EditorProvider>
          </FilesContext.Provider>
        </PaddedSurface>
      </div>
    </>
  );
}
