import { Input } from "@cloudflare/kumo";
import type { HeadingBlock } from "@/data/types";

interface HeadingBlockEditorProps {
  block: HeadingBlock;
  onChange: (block: HeadingBlock) => void;
}

export function HeadingBlockEditor({
  block,
  onChange,
}: HeadingBlockEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            className="w-full"
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Heading text"
          />
        </div>
        <select
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
          value={block.level}
          onChange={(e) =>
            onChange({
              ...block,
              level: parseInt(e.target.value) as HeadingBlock["level"],
            })
          }
        >
          <option value={1}>H1</option>
          <option value={2}>H2</option>
          <option value={3}>H3</option>
          <option value={4}>H4</option>
          <option value={5}>H5</option>
          <option value={6}>H6</option>
        </select>
      </div>
    </div>
  );
}
