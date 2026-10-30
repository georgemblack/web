import { createFileRoute } from "@tanstack/react-router";

import FileListing from "@/components/FileListing";
import { listFiles } from "@/data/files";

export const Route = createFileRoute("/images/")({
  component: ImagesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    year: typeof search.year === "string" ? search.year : String(new Date().getFullYear()),
  }),
  loaderDeps: ({ search }) => ({ year: search.year }),
  loader: async ({ deps }) =>
    await listFiles({ data: { year: Number(deps.year), type: ["IMAGE", "VIDEO"] } }),
});

function ImagesPage() {
  const files = Route.useLoaderData();
  const { year } = Route.useSearch();
  return <FileListing files={files} year={year} page="images" />;
}
