import { Button } from "@cloudflare/kumo";
import { useEditor } from "@portabletext/editor";
import type { BlockPath, PortableTextBlock } from "@portabletext/editor";
import { useState } from "react";

import { VideoDialog } from "./VideoDialog";
import { readVideoValue } from "./VideoValue";

export function VideoBlockObjectEditor({
  value,
  path,
}: {
  value: PortableTextBlock;
  path: BlockPath;
}) {
  const editor = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const current = readVideoValue(value);

  const flags = [
    current.controls && "controls",
    current.autoplay && "autoplay",
    current.muted && "muted",
    current.loop && "loop",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      contentEditable={false}
      className="my-2 flex items-center gap-3 rounded border border-gray-200 p-3"
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-gray-100 text-2xl">
        🎬
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-sm">
          {current.key || "(no file selected)"}
        </div>
        {current.caption && (
          <div className="truncate text-sm text-gray-600 italic">
            {current.caption}
          </div>
        )}
        {flags && <div className="truncate text-xs text-gray-500">{flags}</div>}
      </div>
      <Button variant="secondary" onClick={() => setDialogOpen(true)}>
        Edit
      </Button>
      <VideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValue={current}
        title="Edit video"
        submitLabel="Save"
        onSubmit={(next) => {
          editor.send({
            type: "block.set",
            at: path,
            props: {
              key: next.key,
              caption: next.caption,
              controls: next.controls,
              autoplay: next.autoplay,
              muted: next.muted,
              loop: next.loop,
            },
          });
        }}
      />
    </div>
  );
}
