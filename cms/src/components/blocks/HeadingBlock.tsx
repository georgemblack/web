import { Input, Select } from "@cloudflare/kumo";
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
            aria-label="Heading text"
          />
        </div>
        <Select
          value={String(block.level)}
          onValueChange={(value) => {
            if (value) {
              onChange({
                ...block,
                level: parseInt(value) as HeadingBlock["level"],
              });
            }
          }}
          aria-label="Heading level"
        >
          <Select.Option value="1">H1</Select.Option>
          <Select.Option value="2">H2</Select.Option>
          <Select.Option value="3">H3</Select.Option>
          <Select.Option value="4">H4</Select.Option>
          <Select.Option value="5">H5</Select.Option>
          <Select.Option value="6">H6</Select.Option>
        </Select>
      </div>
    </div>
  );
}
