import { Button } from "@cloudflare/kumo";
import { useEditor } from "@portabletext/editor";
import type { BlockPath, PortableTextBlock } from "@portabletext/editor";
import { useState } from "react";

import { ImageDialog } from "./ImageDialog";
import { readImageValue } from "./ImageValue";

export function ImageBlockObjectEditor({
  value,
  path,
}: {
  value: PortableTextBlock;
  path: BlockPath;
}) {
  const editor = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const current = readImageValue(value);

  return (
    <div
      contentEditable={false}
      className="my-2 flex items-center gap-3 rounded border border-gray-200 p-3"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-300 bg-gray-100">
        {current.key && (
          <img
            src={`https://george.black/files/${current.key}`}
            alt={current.alt || "Preview"}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-sm">
          {current.key || "(no file selected)"}
        </div>
        {current.alt && (
          <div className="truncate text-sm text-gray-600">{current.alt}</div>
        )}
        {current.caption && (
          <div className="truncate text-sm text-gray-600 italic">
            {current.caption}
          </div>
        )}
      </div>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        Edit
      </Button>
      <ImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValue={current}
        title="Edit image"
        submitLabel="Save"
        onSubmit={(next) => {
          editor.send({
            type: "block.set",
            at: path,
            props: {
              key: next.key,
              alt: next.alt,
              caption: next.caption,
            },
          });
        }}
      />
    </div>
  );
}
