import { Button } from "@cloudflare/kumo";
import { useEditor } from "@portabletext/editor";
import { useState } from "react";

import { VideoDialog } from "./VideoDialog";

export function VideoInsertButton() {
  const editor = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setDialogOpen(true)}>
        🎬
      </Button>
      <VideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValue={{ key: "" }}
        title="Insert video"
        submitLabel="Insert"
        onSubmit={(next) => {
          editor.send({
            type: "insert.block object",
            blockObject: {
              name: "video",
              value: {
                key: next.key,
                caption: next.caption,
                controls: next.controls,
                autoplay: next.autoplay,
                muted: next.muted,
                loop: next.loop,
              },
            },
            placement: "auto",
          });
        }}
      />
    </>
  );
}
