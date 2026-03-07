import { useEffect, useState } from "react";
import { listFiles, uploadOptimizedFile } from "@/data/files";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Breadcrumbs, Button, Select, Text } from "@cloudflare/kumo";
import PaddedSurface from "@/components/PaddedSurface";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

export const Route = createFileRoute("/files/new/optimized")({
  component: NewOptimizedFilePage,
});

function NewOptimizedFilePage() {
  const router = useRouter();

  const [year, setYear] = useState(String(currentYear));
  const [files, setFiles] = useState<
    Array<{ fileName: string; optimized: boolean }>
  >([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles(year);
  }, []);

  const loadFiles = async (selectedYear: string) => {
    setLoadingFiles(true);
    setSelectedKey("");
    setError(null);
    try {
      const result = await listFiles({ data: `${selectedYear}/` });
      setFiles(result);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleYearChange = (v: string) => {
    const newYear = v || String(currentYear);
    setYear(newYear);
    loadFiles(newYear);
  };

  const unoptimizedFiles = files.filter((f) => !f.optimized);

  const handleUpload = async () => {
    if (!file || !selectedKey) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("key", selectedKey);
      formData.append("file", file);
      await uploadOptimizedFile({ data: formData });
      await router.navigate({ to: "/files", search: { year } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
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
          <Breadcrumbs.Current>New Optimized File</Breadcrumbs.Current>
        </Breadcrumbs>
      </div>
      <div className="mt-4">
        <PaddedSurface>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Select
                className="w-24"
                value={year}
                onValueChange={(v) =>
                  handleYearChange(v || String(currentYear))
                }
              >
                {YEARS.map((y) => (
                  <Select.Option key={y} value={y}>
                    {y}
                  </Select.Option>
                ))}
              </Select>
              <Select
                className="flex-1"
                value={selectedKey}
                onValueChange={(v) => setSelectedKey(v || "")}
                disabled={loadingFiles || unoptimizedFiles.length === 0}
              >
                {unoptimizedFiles.length === 0 && !loadingFiles ? (
                  <Select.Option value="">No unoptimized images</Select.Option>
                ) : (
                  <>
                    <Select.Option value="">Select an image...</Select.Option>
                    {unoptimizedFiles.map((f) => (
                      <Select.Option key={f.fileName} value={f.fileName}>
                        {f.fileName}
                      </Select.Option>
                    ))}
                  </>
                )}
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!file || !selectedKey || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {error && <Text variant="secondary">{error}</Text>}
          </div>
        </PaddedSurface>
      </div>
    </>
  );
}
