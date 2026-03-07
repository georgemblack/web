import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@cloudflare/kumo";
import type { Editor } from "@tiptap/react";
import type { ContentBlock } from "@/data/types";
import { MarkdownBlockEditor } from "@/components/blocks/MarkdownBlock";
import { ImageBlockEditor } from "@/components/blocks/ImageBlock";
import { VideoBlockEditor } from "@/components/blocks/VideoBlock";
import {
  TextBlockEditor,
  TextBlockToolbar,
} from "@/components/blocks/TextBlock";
import { HeadingBlockEditor } from "@/components/blocks/HeadingBlock";
import { QuoteBlockEditor } from "@/components/blocks/QuoteBlock";
import { CodeBlockEditor } from "@/components/blocks/CodeBlock";
import { LineBlockEditor } from "@/components/blocks/LineBlock";
import { BreakBlockEditor } from "@/components/blocks/BreakBlock";

export type BlockWithId = ContentBlock & { _id: string };

const EMOJI = {
  grip: "\u2630", // Trigram for heaven (hamburger menu style)
  trash: "\uD83D\uDDD1\uFE0F", // Wastebasket
  up: "\u2B06\uFE0F", // Up arrow
  down: "\u2B07\uFE0F", // Down arrow
};

interface BlockEditorProps {
  block: BlockWithId;
  fileNames: string[];
  onChange: (block: BlockWithId) => void;
  onTextEditor?: (editor: Editor | null) => void;
}

function BlockEditor({
  block,
  fileNames,
  onChange,
  onTextEditor,
}: BlockEditorProps) {
  const handleChange = (updatedBlock: ContentBlock) => {
    onChange({ ...updatedBlock, _id: block._id } as BlockWithId);
  };

  switch (block.type) {
    case "markdown":
      return <MarkdownBlockEditor block={block} onChange={handleChange} />;
    case "image":
      return (
        <ImageBlockEditor
          block={block}
          fileNames={fileNames}
          onChange={handleChange}
        />
      );
    case "video":
      return (
        <VideoBlockEditor
          block={block}
          fileNames={fileNames}
          onChange={handleChange}
        />
      );
    case "text":
      return (
        <TextBlockEditor
          block={block}
          onChange={handleChange}
          onEditor={onTextEditor}
        />
      );
    case "heading":
      return <HeadingBlockEditor block={block} onChange={handleChange} />;
    case "quote":
      return <QuoteBlockEditor block={block} onChange={handleChange} />;
    case "code":
      return <CodeBlockEditor block={block} onChange={handleChange} />;
    case "line":
      return <LineBlockEditor />;
    case "break":
      return <BreakBlockEditor />;
    default:
      return <div>Unknown block type</div>;
  }
}

// Sortable Block Item
interface SortableBlockItemProps {
  block: BlockWithId;
  fileNames: string[];
  onChange: (block: BlockWithId) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function SortableBlockItem({
  block,
  fileNames,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SortableBlockItemProps) {
  const [textEditor, setTextEditor] = useState<Editor | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex justify-between">
        <div>
          {block.type === "text" && <TextBlockToolbar editor={textEditor} />}
        </div>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            shape="square"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            {EMOJI.grip}
          </Button>
          <Button
            variant="secondary"
            shape="square"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move block up"
          >
            {EMOJI.up}
          </Button>
          <Button
            variant="secondary"
            shape="square"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move block down"
          >
            {EMOJI.down}
          </Button>
          <Button
            variant="secondary-destructive"
            shape="square"
            onClick={onDelete}
            aria-label="Delete block"
          >
            {EMOJI.trash}
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <BlockEditor
          block={block}
          fileNames={fileNames}
          onChange={onChange}
          onTextEditor={setTextEditor}
        />
      </div>
    </div>
  );
}
