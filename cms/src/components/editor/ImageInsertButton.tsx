import { Button } from "@cloudflare/kumo";
import { useEditor } from "@portabletext/editor";
import { useState } from "react";

import { ImageDialog } from "./ImageDialog";

export function ImageInsertButton() {
  const editor = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setDialogOpen(true)}>
        🖼️
      </Button>
      <ImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValue={{ key: "", alt: "", caption: undefined }}
        title="Insert image"
        submitLabel="Insert"
        onSubmit={(next) => {
          editor.send({
            type: "insert.block object",
            blockObject: {
              name: "image",
              value: {
                key: next.key,
                alt: next.alt,
                caption: next.caption,
              },
            },
            placement: "auto",
          });
        }}
      />
    </>
  );
}
