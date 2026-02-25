import { Input } from "@cloudflare/kumo";
import type { ImageBlock } from "@/data/types";

interface ImageBlockEditorProps {
  block: ImageBlock;
  onChange: (block: ImageBlock) => void;
}

export function ImageBlockEditor({ block, onChange }: ImageBlockEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 flex-shrink-0 rounded border border-gray-300 bg-gray-100 overflow-hidden">
          {block.url && (
            <img
              src={block.url}
              alt={block.alt || "Preview"}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <Input
            className="w-full"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="/images/example.jpg"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            className="w-full"
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt text"
          />
        </div>
        <div className="flex-1">
          <Input
            className="w-full"
            value={block.caption ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                caption: e.target.value || undefined,
              })
            }
            placeholder="Caption"
          />
        </div>
      </div>
    </div>
  );
}
