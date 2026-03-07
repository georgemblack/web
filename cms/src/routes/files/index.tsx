import { useMemo, useState } from "react";
import { deleteFile, listFiles, toggleOptimize } from "@/data/files";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Badge, Breadcrumbs, Button, Input, Select } from "@cloudflare/kumo";
import PaddedSurface from "@/components/PaddedSurface";

const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

type OptimizedFilter = "all" | "optimized" | "unoptimized";
const OPTIMIZED_OPTIONS: OptimizedFilter[] = [
  "all",
  "optimized",
  "unoptimized",
];

export const Route = createFileRoute("/files/")({
  component: FilesPage,
  loader: async () => await listFiles(),
});

function FilesPage() {
  const files = Route.useLoaderData();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [optimizedFilter, setOptimizedFilter] =
    useState<OptimizedFilter>("all");

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.fileName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesYear =
        yearFilter === "all" || f.fileName.startsWith(`${yearFilter}/`);
      const matchesOptimized =
        optimizedFilter === "all" ||
        (optimizedFilter === "optimized" && f.optimized) ||
        (optimizedFilter === "unoptimized" && !f.optimized);
      return matchesSearch && matchesYear && matchesOptimized;
    });
  }, [files, searchQuery, yearFilter, optimizedFilter]);

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
        <div className="flex gap-2">
          <Link to="/files/new">
            <Button variant="primary">New File</Button>
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <PaddedSurface>
          <div>
            <Input
              className="w-full"
              placeholder="Search..."
              aria-label="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-3 items-center">
            <Select
              className="w-30"
              value={yearFilter}
              onValueChange={(v) => setYearFilter(v || "all")}
            >
              <Select.Option value="all">all years</Select.Option>
              {YEARS.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}
                </Select.Option>
              ))}
            </Select>
            <Select
              className="w-36"
              value={optimizedFilter}
              onValueChange={(v) =>
                setOptimizedFilter((v as OptimizedFilter) || "all")
              }
            >
              {OPTIMIZED_OPTIONS.map((opt) => (
                <Select.Option key={opt} value={opt}>
                  {opt}
                </Select.Option>
              ))}
            </Select>
          </div>
        </PaddedSurface>
        <div className="mt-4 flex flex-col gap-4">
          {filteredFiles.map((f) => (
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
