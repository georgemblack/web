import {
  Badge,
  Breadcrumbs,
  Button,
  Input,
  Select,
  Switch,
} from "@cloudflare/kumo";
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";

import PaddedSurface from "@/components/PaddedSurface";
import { deleteFile, listFiles, toggleOptimize } from "@/data/files";

const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

export const Route = createFileRoute("/files/")({
  component: FilesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    year: String(search.year ?? new Date().getFullYear()),
  }),
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: async ({ deps }) => await listFiles({ data: Number(deps.year) }),
});

function FilesPage() {
  const files = Route.useLoaderData();
  const { year } = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [showUnoptimizedOnly, setShowUnoptimizedOnly] = useState(false);

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.key
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter = !showUnoptimizedOnly || !f.optimized;
      return matchesSearch && matchesFilter;
    });
  }, [files, searchQuery, showUnoptimizedOnly]);

  const handleToggleOptimize = async (fileName: string) => {
    await toggleOptimize({ data: fileName });
    await router.invalidate();
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    await deleteFile({ data: fileName });
    await router.invalidate();
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
          <div className="mt-4 flex items-center gap-3">
            <Select
              className="w-30"
              value={year}
              onValueChange={(v) =>
                navigate({
                  to: "/files",
                  search: { year: v || String(new Date().getFullYear()) },
                })
              }
            >
              {YEARS.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}
                </Select.Option>
              ))}
            </Select>
            <div>
              <Switch
                label="Unoptimized"
                checked={showUnoptimizedOnly}
                onCheckedChange={setShowUnoptimizedOnly}
              />
            </div>
          </div>
        </PaddedSurface>
        <div className="mt-4 flex flex-col gap-4">
          {filteredFiles.map((f) => (
            <div className="flex items-center gap-3" key={f.key}>
              <img
                src={`https://george.black/files/${f.key}`}
                className="h-12 w-12 rounded object-cover"
                alt=""
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-sm">{f.key}</div>
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
                  aria-label="Toggle optimize"
                  onClick={() => handleToggleOptimize(f.key)}
                >
                  🐳
                </Button>
                <Button
                  variant="secondary-destructive"
                  shape="square"
                  aria-label="Delete file"
                  onClick={() => handleDelete(f.key)}
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
