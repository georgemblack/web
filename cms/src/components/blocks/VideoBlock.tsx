import { Input, Select, Switch } from "@cloudflare/kumo";

import type { VideoBlock } from "@/data/types";

interface VideoBlockEditorProps {
  block: VideoBlock;
  fileNames: string[];
  onChange: (block: VideoBlock) => void;
}

export function VideoBlockEditor({
  block,
  fileNames,
  onChange,
}: VideoBlockEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-2">
          <Input
            className="flex-1"
            value={block.key}
            onChange={(e) => onChange({ ...block, key: e.target.value })}
            placeholder="2020/video.mp4"
            aria-label="Video key"
          />
          {fileNames.length > 0 && (
            <Select
              className="w-48"
              value=""
              onValueChange={(fileName) => {
                if (fileName) {
                  onChange({
                    ...block,
                    key: fileName,
                  });
                }
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
            aria-label="Caption"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <Switch
          label="Controls"
          checked={block.controls ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...block, controls: checked || undefined })
          }
        />
        <Switch
          label="Autoplay"
          checked={block.autoplay ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...block, autoplay: checked || undefined })
          }
        />
        <Switch
          label="Muted"
          checked={block.muted ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...block, muted: checked || undefined })
          }
        />
        <Switch
          label="Loop"
          checked={block.loop ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...block, loop: checked || undefined })
          }
        />
      </div>
    </div>
  );
}
