import { Button, Dialog, Input, Select } from "@cloudflare/kumo";
import { useState } from "react";
import type { FormEvent } from "react";

import { useFilesOfType } from "./FilesContext";
import type { ImageValue } from "./ImageValue";

export interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: ImageValue;
  onSubmit: (value: ImageValue) => void;
  title: string;
  submitLabel: string;
}

export function ImageDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  title,
  submitLabel,
}: ImageDialogProps) {
  const fileNames = useFilesOfType("IMAGE");
  const [key, setKey] = useState(initialValue.key);
  const [alt, setAlt] = useState(initialValue.alt);
  const [caption, setCaption] = useState(initialValue.caption ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setKey(initialValue.key);
      setAlt(initialValue.alt);
      setCaption(initialValue.caption ?? "");
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!key) return;
    onSubmit({
      key,
      alt,
      caption: caption || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog className="p-8" size="base">
        <div className="mb-4 flex items-start justify-between gap-4">
          <Dialog.Title className="text-2xl font-semibold">
            {title}
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
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex items-start gap-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-300 bg-gray-100">
              {key && (
                <img
                  src={`https://george.black/files/${key}`}
                  alt={alt || "Preview"}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="picture.jpg"
                aria-label="Image key"
                autoFocus
              />
              {fileNames.length > 0 && (
                <Select
                  value=""
                  onValueChange={(fileName) => {
                    if (fileName) setKey(fileName);
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
          <Input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Alt text"
            aria-label="Alt text"
          />
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            aria-label="Caption"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close
              render={(props) => (
                <Button {...props} variant="secondary">
                  Cancel
                </Button>
              )}
            />
            <Button variant="primary" type="submit" disabled={!key}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
