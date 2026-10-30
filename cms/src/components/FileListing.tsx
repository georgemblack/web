import { Breadcrumbs, Button, Input, Select, Switch } from "@cloudflare/kumo";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import PaddedSurface from "@/components/PaddedSurface";
import { deleteFile, toggleOptimize } from "@/data/files";
import type { WebFile } from "@/data/types";

const YEARS = Array.from({ length: 16 }, (_, i) => String(2015 + i));

type FileListingProps = { files: WebFile[] } & (
  | { page: "files"; year?: never }
  | { page: "images"; year: string }
);

export default function FileListing({ files, year, page }: FileListingProps) {
  const isImages = page === "images";
  const title = isImages ? "Images" : "Files";
  const router = useRouter();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [showUnoptimizedOnly, setShowUnoptimizedOnly] = useState(false);

  const filteredFiles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return files.filter((f) => {
      const matchesSearch = f.key.toLowerCase().includes(query);
      const matchesFilter = !isImages || !showUnoptimizedOnly || !f.optimize;
      return matchesSearch && matchesFilter;
    });
  }, [files, isImages, searchQuery, showUnoptimizedOnly]);

  const handleToggleOptimize = async (fileName: string) => {
    await toggleOptimize({ data: fileName });
    await router.invalidate();
  };

  const handleCopyUrl = async (key: string) => {
    try {
      const path = key.split("/").map(encodeURIComponent).join("/");
      await navigator.clipboard.writeText(`https://george.black/files/${path}`);
      setCopiedKey(key);
      setCopyMessage(`Copied URL for ${key}`);
    } catch {
      setCopiedKey(null);
      setCopyMessage("Could not copy the URL. Please try again.");
    }
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
          <Breadcrumbs.Current>{title}</Breadcrumbs.Current>
        </Breadcrumbs>
        <div className="flex gap-2">
          {isImages ? (
            <Link to="/files">
              <Button variant="secondary">Files</Button>
            </Link>
          ) : (
            <Link to="/images" search={{ year: String(new Date().getFullYear()) }}>
              <Button variant="secondary">Images</Button>
            </Link>
          )}
          <Link to="/files/new">
            <Button variant="primary">New File</Button>
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <PaddedSurface>
          <Input
            className="w-full"
            placeholder="Search..."
            aria-label="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isImages && (
            <div className="mt-4 flex items-center gap-3">
              <Select
                className="w-30"
                value={year}
                onValueChange={(v) =>
                  navigate({
                    to: "/images",
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
              <Switch
                label="Optimization disabled"
                checked={showUnoptimizedOnly}
                onCheckedChange={setShowUnoptimizedOnly}
              />
            </div>
          )}
        </PaddedSurface>
        {!isImages && (
          <p role="status" className="mt-2 text-sm">
            {copyMessage}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-4">
          {filteredFiles.map((f) => (
            <div className="flex items-center gap-3" key={f.key}>
              {isImages &&
                (f.type === "VIDEO" ? (
                  <video
                    src={`https://george.black/files/${f.key}`}
                    className="h-12 w-12 rounded object-cover"
                    preload="metadata"
                    muted
                    playsInline
                    aria-label={f.key}
                  />
                ) : (
                  <img
                    src={`https://george.black/files/${f.key}`}
                    className="h-12 w-12 rounded object-cover"
                    alt=""
                  />
                ))}
              <div className="min-w-0 flex-1 truncate font-mono text-sm">{f.key}</div>
              <div className="flex gap-1">
                {isImages ? (
                  <Button
                    variant="secondary"
                    shape="square"
                    aria-label="Toggle optimize"
                    disabled={f.type !== "IMAGE"}
                    onClick={() => handleToggleOptimize(f.key)}
                  >
                    🐳
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    shape="square"
                    aria-label={`Copy URL for ${f.key}`}
                    title="Copy file URL"
                    onClick={() => handleCopyUrl(f.key)}
                  >
                    {copiedKey === f.key ? "✅" : "📋"}
                  </Button>
                )}
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
