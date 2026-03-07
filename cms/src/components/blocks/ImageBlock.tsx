import { Input, Select } from "@cloudflare/kumo";
import type { ImageBlock } from "@/data/types";

interface ImageBlockEditorProps {
  block: ImageBlock;
  fileNames: string[];
  onChange: (block: ImageBlock) => void;
}

export function ImageBlockEditor({
  block,
  fileNames,
  onChange,
}: ImageBlockEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 flex-shrink-0 rounded border border-gray-300 bg-gray-100 overflow-hidden">
          {block.key && (
            <img
              src={`/files/${block.key}`}
              alt={block.alt || "Preview"}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 flex gap-2">
          <Input
            className="flex-1"
            value={block.key}
            onChange={(e) => onChange({ ...block, key: e.target.value })}
            placeholder="2020/picture.jpg"
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
