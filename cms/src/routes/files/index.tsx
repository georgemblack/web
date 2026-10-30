import { createFileRoute } from "@tanstack/react-router";

import FileListing from "@/components/FileListing";
import { listFiles } from "@/data/files";

export const Route = createFileRoute("/files/")({
  component: FilesPage,
  loader: async () => await listFiles({ data: { type: "DOCUMENT" } }),
});

function FilesPage() {
  const files = Route.useLoaderData();
  return <FileListing files={files} page="files" />;
}
