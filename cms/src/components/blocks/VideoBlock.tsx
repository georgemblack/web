import { Input } from "@cloudflare/kumo";
import type { VideoBlock } from "@/data/types";

interface VideoBlockEditorProps {
  block: VideoBlock;
  onChange: (block: VideoBlock) => void;
}

export function VideoBlockEditor({ block, onChange }: VideoBlockEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 flex-shrink-0 rounded border border-gray-300 bg-gray-100 overflow-hidden">
          {block.url && (
            <img
              src={block.url}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <Input
            className="w-full"
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="/videos/example.mp4"
          />
        </div>
      </div>
      <div className="flex gap-2">
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
