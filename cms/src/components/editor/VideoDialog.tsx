import { Button, Dialog, Input, Select, Switch } from "@cloudflare/kumo";
import { useState } from "react";
import type { FormEvent } from "react";

import { useFilesOfType } from "./FilesContext";
import type { VideoValue } from "./VideoValue";

export interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: VideoValue;
  onSubmit: (value: VideoValue) => void;
  title: string;
  submitLabel: string;
}

export function VideoDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  title,
  submitLabel,
}: VideoDialogProps) {
  const fileNames = useFilesOfType("VIDEO");
  const [key, setKey] = useState(initialValue.key);
  const [caption, setCaption] = useState(initialValue.caption ?? "");
  const [controls, setControls] = useState(initialValue.controls ?? false);
  const [autoplay, setAutoplay] = useState(initialValue.autoplay ?? false);
  const [muted, setMuted] = useState(initialValue.muted ?? false);
  const [loop, setLoop] = useState(initialValue.loop ?? false);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setKey(initialValue.key);
      setCaption(initialValue.caption ?? "");
      setControls(initialValue.controls ?? false);
      setAutoplay(initialValue.autoplay ?? false);
      setMuted(initialValue.muted ?? false);
      setLoop(initialValue.loop ?? false);
    }
    onOpenChange(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!key) return;
    onSubmit({
      key,
      caption: caption || undefined,
      controls: controls || undefined,
      autoplay: autoplay || undefined,
      muted: muted || undefined,
      loop: loop || undefined,
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
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="video.mp4"
            aria-label="Video key"
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
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            aria-label="Caption"
          />
          <div className="flex flex-wrap gap-3">
            <Switch
              label="Controls"
              checked={controls}
              onCheckedChange={setControls}
            />
            <Switch
              label="Autoplay"
              checked={autoplay}
              onCheckedChange={setAutoplay}
            />
            <Switch label="Muted" checked={muted} onCheckedChange={setMuted} />
            <Switch label="Loop" checked={loop} onCheckedChange={setLoop} />
          </div>
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
