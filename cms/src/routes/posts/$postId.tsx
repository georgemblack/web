import { useState } from "react";
import { getPost, updatePost } from "@/data/db";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Breadcrumbs, Button, Input, Switch, Text } from "@cloudflare/kumo";
import type { Post, ContentBlock, PostStatus } from "@/data/types";
import {
  SortableBlockItem,
  type BlockWithId,
} from "@/components/SortableBlockItem";
import PaddedSurface from "@/components/PaddedSurface";

export const Route = createFileRoute("/posts/$postId")({
  ssr: "data-only",
  component: RouteComponent,
  loader: async ({ params }) => await getPost({ data: params.postId }),
});

function generateBlockId(): string {
  return crypto.randomUUID();
}

function addIdsToBlocks(blocks: ContentBlock[]): BlockWithId[] {
  return blocks.map((block) => ({
    ...block,
    _id: generateBlockId(),
  }));
}

function removeIdsFromBlocks(blocks: BlockWithId[]): ContentBlock[] {
  return blocks.map(({ _id, ...block }) => block as ContentBlock);
}

// Emoji constants
const EMOJI = {
  markdown: "\uD83D\uDCDD", // Memo
  image: "\uD83D\uDDBC\uFE0F", // Framed picture
  video: "\uD83C\uDFA5", // Movie camera
  text: "\u270D\uFE0F", // Writing hand
  heading: "\uD83D\uDD24", // Input Latin letters (abc with arrow)
  quote: "\u275D", // Heavy double turned comma quotation mark
  code: "\uD83D\uDCBB", // Laptop
  line: "\u2500", // Box drawings light horizontal
  break: "\u2702\uFE0F", // Scissors
  draft: "\uD83D\uDCDD", // Memo
  published: "\uD83D\uDE80", // Rocket
  hidden: "\uD83E\uDEE3", // Face with peeking eye
  visible: "\uD83D\uDC40", // Eyes
  gallery: "\uD83D\uDDBC\uFE0F", // Framed picture
};

// Add Block Row
interface AddBlockRowProps {
  onAdd: (type: ContentBlock["type"]) => void;
}

function AddBlockRow({ onAdd }: AddBlockRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("text")}
        aria-label="Add Text"
      >
        {EMOJI.text} Text
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("markdown")}
        aria-label="Add Markdown"
      >
        {EMOJI.markdown} Markdown
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("image")}
        aria-label="Add Image"
      >
        {EMOJI.image} Image
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("video")}
        aria-label="Add Video"
      >
        {EMOJI.video} Video
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("heading")}
        aria-label="Add Heading"
      >
        {EMOJI.heading} Heading
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("quote")}
        aria-label="Add Quote"
      >
        {EMOJI.quote} Quote
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("code")}
        aria-label="Add Code"
      >
        {EMOJI.code} Code
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("line")}
        aria-label="Add Line"
      >
        {EMOJI.line} Line
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onAdd("break")}
        aria-label="Add Break"
      >
        {EMOJI.break} Break
      </Button>
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
          <div className="ml-1 mt-1">
            <Text variant="secondary">{slug}</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <Input
            className="w-full"
            type="datetime-local"
            value={toDatetimeLocal(published)}
            onChange={(e) => onChange("published", toISOString(e.target.value))}
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
  const post = Route.useLoaderData();

  if (!post) {
    return <span>Post not found</span>;
  }

  return <PostEditor key={post.updated} post={post} />;
}

interface PostEditorProps {
  post: Post;
}

function PostEditor({ post }: PostEditorProps) {
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
  const [blocks, setBlocks] = useState<BlockWithId[]>(() =>
    addIdsToBlocks(post.content),
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
    JSON.stringify(removeIdsFromBlocks(blocks)) !==
      JSON.stringify(post.content);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleBlockChange = (index: number, updatedBlock: BlockWithId) => {
    setBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = updatedBlock;
      return newBlocks;
    });
  };

  const handleBlockDelete = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBlockMoveUp = (index: number) => {
    if (index <= 0) return;
    setBlocks((prev) => {
      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [
        newBlocks[index],
        newBlocks[index - 1],
      ];
      return newBlocks;
    });
  };

  const handleBlockMoveDown = (index: number) => {
    setBlocks((prev) => {
      if (index >= prev.length - 1) return prev;
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [
        newBlocks[index + 1],
        newBlocks[index],
      ];
      return newBlocks;
    });
  };

  const handleAddBlock = (type: ContentBlock["type"]) => {
    let newBlock: BlockWithId;

    switch (type) {
      case "markdown":
        newBlock = {
          _id: generateBlockId(),
          type: "markdown",
          text: "",
        };
        break;
      case "image":
        newBlock = {
          _id: generateBlockId(),
          type: "image",
          url: "",
          alt: "",
        };
        break;
      case "video":
        newBlock = {
          _id: generateBlockId(),
          type: "video",
          url: "",
        };
        break;
      case "text":
        newBlock = {
          _id: generateBlockId(),
          type: "text",
          text: "",
        };
        break;
      case "heading":
        newBlock = {
          _id: generateBlockId(),
          type: "heading",
          text: "",
          level: 2,
        };
        break;
      case "quote":
        newBlock = {
          _id: generateBlockId(),
          type: "quote",
          text: "",
        };
        break;
      case "code":
        newBlock = {
          _id: generateBlockId(),
          type: "code",
          text: "",
        };
        break;
      case "line":
        newBlock = {
          _id: generateBlockId(),
          type: "line",
        };
        break;
      case "break":
        newBlock = {
          _id: generateBlockId(),
          type: "break",
        };
        break;
    }

    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((block) => block._id === active.id);
        const newIndex = prev.findIndex((block) => block._id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

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
          content: removeIdsFromBlocks(blocks),
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
        <div className="flex gap-4 items-center">
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

      <div className="mt-6 flex flex-col gap-4">
        {blocks.length === 0 ? (
          <Text variant="secondary">No content blocks yet. Add one below.</Text>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b._id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.map((block, index) => (
                <SortableBlockItem
                  key={block._id}
                  block={block}
                  onChange={(updatedBlock) =>
                    handleBlockChange(index, updatedBlock)
                  }
                  onDelete={() => handleBlockDelete(index)}
                  onMoveUp={() => handleBlockMoveUp(index)}
                  onMoveDown={() => handleBlockMoveDown(index)}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        <AddBlockRow onAdd={handleAddBlock} />
      </div>
    </>
  );
}
