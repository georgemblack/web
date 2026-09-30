import { Button, Input } from "@cloudflare/kumo";
import { Popover } from "@cloudflare/kumo/primitives/popover";
import { useAnnotationPopover } from "@portabletext/toolbar";
import type { ToolbarAnnotationSchemaType } from "@portabletext/toolbar";
import { useState } from "react";

// Shows the URL of the link under the cursor, with buttons to edit or remove it.
export function LinkPopover({
  schemaTypes,
}: {
  schemaTypes: ReadonlyArray<ToolbarAnnotationSchemaType>;
}) {
  const popover = useAnnotationPopover({ schemaTypes });
  const link = popover.snapshot.context.annotations.find((a) => a.schemaType.name === "link");
  const isOpen = popover.snapshot.matches({ enabled: "active" }) && link !== undefined;

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) popover.send({ type: "close" });
      }}
    >
      <Popover.Portal>
        <Popover.Positioner
          anchor={popover.snapshot.context.elementRef}
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50"
        >
          {/* Don't pull focus out of the editor when the cursor moves into a link. */}
          <Popover.Popup
            initialFocus={false}
            finalFocus={false}
            className="bg-kumo-base text-kumo-default shadow-kumo-tip-shadow outline-kumo-fill rounded-lg px-3 py-2 text-sm shadow-lg outline"
          >
            {link && (
              // Keyed by link so switching links resets the edit form.
              <LinkPopoverContent
                key={link.value._key}
                href={typeof link.value.href === "string" ? link.value.href : ""}
                onSave={(href) => popover.send({ type: "edit", at: link.at, props: { href } })}
                onRemove={() => popover.send({ type: "remove", schemaType: link.schemaType })}
              />
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function LinkPopoverContent({
  href,
  onSave,
  onRemove,
}: {
  href: string;
  onSave: (href: string) => void;
  onRemove: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(href);

  if (isEditing) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft) {
            onSave(draft);
            setIsEditing(false);
          }
        }}
      >
        <Input
          aria-label="URL"
          className="w-72"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <Button variant="primary" type="submit">
          Save
        </Button>
        <Button variant="ghost" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="max-w-72 truncate text-blue-600 underline"
      >
        {href || "(no URL)"}
      </a>
      <Button
        variant="ghost"
        onClick={() => {
          setDraft(href);
          setIsEditing(true);
        }}
      >
        Edit
      </Button>
      <Button variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
