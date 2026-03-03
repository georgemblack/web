import { useState } from "react";
import {
  deleteFile,
  listFiles,
  toggleOptimize,
  uploadFile,
} from "@/data/files";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Badge,
  Breadcrumbs,
  Button,
  Input,
  Select,
  Switch,
} from "@cloudflare/kumo";
import PaddedSurface from "@/components/PaddedSurface";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

export const Route = createFileRoute("/files/")({
  component: FilesPage,
  loader: async () => await listFiles(),
});

function FilesPage() {
  const files = Route.useLoaderData();
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
      setTitle("");
      setFile(null);
      setOptimize(false);
      await router.invalidate();
    } finally {
      setUploading(false);
    }
  };

  const handleToggleOptimize = async (fileName: string) => {
    await toggleOptimize({ data: fileName });
    await router.invalidate();
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    await deleteFile({ data: fileName });
    await router.invalidate();
  };

  const copyToClipboard = (fileName: string) => {
    navigator.clipboard.writeText(`https://george.black/files/${fileName}`);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Breadcrumbs>
          <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
          <Breadcrumbs.Separator />
          <Breadcrumbs.Current>Files</Breadcrumbs.Current>
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
        <div className="mt-4 flex flex-col gap-4">
          {files.map((f) => (
            <div className="flex items-center gap-3" key={f.fileName}>
              <img
                src={`https://george.black/files/${f.fileName}`}
                className="h-12 w-12 rounded object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm truncate">{f.fileName}</div>
                {f.optimized && (
                  <Badge variant="primary" className="mt-1">
                    optimized
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  shape="square"
                  size="sm"
                  onClick={() => copyToClipboard(f.fileName)}
                >
                  ✏️
                </Button>
                <Button
                  variant="secondary"
                  shape="square"
                  size="sm"
                  onClick={() => handleToggleOptimize(f.fileName)}
                >
                  🐳
                </Button>
                <Button
                  variant="secondary-destructive"
                  shape="square"
                  size="sm"
                  onClick={() => handleDelete(f.fileName)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
