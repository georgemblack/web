import { Button, Dialog, Input, Select } from "@cloudflare/kumo";
import { useEditor } from "@portabletext/editor";
import {
  useAnnotationButton,
  useDecoratorButton,
  useListButton,
  useStyleSelector,
  useToolbarSchema,
} from "@portabletext/toolbar";
import type {
  ToolbarAnnotationSchemaType,
  ToolbarDecoratorSchemaType,
  ToolbarListSchemaType,
  ToolbarStyleSchemaType,
} from "@portabletext/toolbar";
import { useState } from "react";

import { ImageInsertButton } from "./ImageInsertButton";
import { VideoInsertButton } from "./VideoInsertButton";

const DECORATOR_LABELS: Record<string, string> = {
  strong: "B",
  em: "I",
  underline: "U",
};

const LIST_LABELS: Record<string, string> = {
  bullet: "UL",
  number: "OL",
};

function DecoratorButton({
  schemaType,
}: {
  schemaType: ToolbarDecoratorSchemaType;
}) {
  const button = useDecoratorButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  return (
    <Button
      variant={isActive ? "primary" : "ghost"}
      onClick={() => button.send({ type: "toggle" })}
    >
      {DECORATOR_LABELS[schemaType.name] ?? schemaType.name}
    </Button>
  );
}

function ListToggleButton({
  schemaType,
}: {
  schemaType: ToolbarListSchemaType;
}) {
  const button = useListButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  return (
    <Button
      variant={isActive ? "primary" : "ghost"}
      onClick={() => button.send({ type: "toggle" })}
    >
      {LIST_LABELS[schemaType.name] ?? schemaType.name}
    </Button>
  );
}

function LinkButton({
  schemaType,
}: {
  schemaType: ToolbarAnnotationSchemaType;
}) {
  const button = useAnnotationButton({ schemaType });
  const isActive = button.snapshot.matches({ enabled: "active" });
  const isShowingDialog = button.snapshot.matches({
    enabled: { inactive: "showing dialog" },
  });
  const [href, setHref] = useState("");

  return (
    <>
      <Button
        variant={isActive ? "primary" : "ghost"}
        onClick={() => {
          if (isActive) {
            button.send({ type: "remove" });
          } else {
            button.send({ type: "open dialog" });
          }
        }}
      >
        🔗
      </Button>
      <Dialog.Root
        open={isShowingDialog}
        onOpenChange={(open) => {
          if (!open) {
            button.send({ type: "close dialog" });
            setHref("");
          }
        }}
      >
        <Dialog className="p-8" size="sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-2xl font-semibold">
              Add Link
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              render={(props) => (
                <Button {...props} variant="secondary" aria-label="Close">
                  ✕
                </Button>
              )}
            />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (href) {
                button.send({
                  type: "add",
                  annotation: { value: { href } },
                });
                setHref("");
              }
            }}
          >
            <Input
              aria-label="URL"
              placeholder="https://..."
              value={href}
              onChange={(e) => setHref(e.target.value)}
              autoFocus
            />
            <div className="mt-8 flex justify-end gap-2">
              <Dialog.Close
                render={(props) => (
                  <Button {...props} variant="secondary">
                    Cancel
                  </Button>
                )}
              />
              <Button variant="primary" type="submit">
                Add
              </Button>
            </div>
          </form>
        </Dialog>
      </Dialog.Root>
    </>
  );
}

function StyleSelect({
  schemaTypes,
}: {
  schemaTypes: ReadonlyArray<ToolbarStyleSchemaType>;
}) {
  const selector = useStyleSelector({ schemaTypes });
  return (
    <Select
      aria-label="Block style"
      value={selector.snapshot.context.activeStyle ?? "normal"}
      onValueChange={(value) =>
        selector.send({ type: "toggle", style: value as string })
      }
    >
      {schemaTypes.map((style) => (
        <Select.Option key={style.name} value={style.name}>
          {style.name}
        </Select.Option>
      ))}
    </Select>
  );
}

function BlockObjectInsertButton({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: Record<string, unknown>;
}) {
  const editor = useEditor();
  return (
    <Button
      variant="ghost"
      onClick={() =>
        editor.send({
          type: "insert.block object",
          blockObject: {
            name,
            value: defaultValue ?? {},
          },
          placement: "auto",
        })
      }
    >
      {label}
    </Button>
  );
}

export function Toolbar() {
  const schema = useToolbarSchema({});
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {schema.decorators?.map((dec) => (
            <DecoratorButton key={dec.name} schemaType={dec} />
          ))}
          {schema.lists?.map((list) => (
            <ListToggleButton key={list.name} schemaType={list} />
          ))}
        </div>
        <div>
          {schema.styles && <StyleSelect schemaTypes={schema.styles} />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {schema.annotations?.map((ann) => (
          <LinkButton key={ann.name} schemaType={ann} />
        ))}
        <ImageInsertButton />
        <VideoInsertButton />
        <BlockObjectInsertButton
          name="code"
          label="💻"
          defaultValue={{ text: "" }}
        />
        <BlockObjectInsertButton name="line" label="➖" />
        <BlockObjectInsertButton name="break" label="✂️" />
      </div>
    </div>
  );
}
