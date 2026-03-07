import { useState } from "react";
import { uploadFile } from "@/data/files";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Breadcrumbs, Button, Input, Select, Switch } from "@cloudflare/kumo";
import PaddedSurface from "@/components/PaddedSurface";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

export const Route = createFileRoute("/files/new")({
  component: NewFilePage,
});

function NewFilePage() {
  const router = useRouter();

  const [year, setYear] = useState(String(currentYear));
  const [title, setTitle] = useState("");
  const [optimize, setOptimize] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("year", year);
      formData.append("title", title);
      formData.append("file", file);
      if (optimize) formData.append("optimize", "on");
      await uploadFile({ data: formData });
      await router.navigate({ to: "/files" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Breadcrumbs>
          <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
          <Breadcrumbs.Separator />
          <Breadcrumbs.Link href="/files">Files</Breadcrumbs.Link>
          <Breadcrumbs.Separator />
          <Breadcrumbs.Current>New File</Breadcrumbs.Current>
        </Breadcrumbs>
      </div>
      <div className="mt-4">
        <PaddedSurface>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Select
                className="w-24"
                value={year}
                onValueChange={(v) => setYear(v || String(currentYear))}
              >
                {YEARS.map((y) => (
                  <Select.Option key={y} value={y}>
                    {y}
                  </Select.Option>
                ))}
              </Select>
              <Input
                className="flex-1"
                placeholder="Title"
                aria-label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                label="Optimize"
                checked={optimize}
                onCheckedChange={setOptimize}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!file || !title || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </PaddedSurface>
      </div>
    </>
  );
}
