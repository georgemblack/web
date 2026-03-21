import { createFileRoute } from "@tanstack/react-router";

import { getRenderedPost } from "@/data/db";

export const Route = createFileRoute("/api/posts/$postId/rendered/")({
  server: {
    handlers: {
      GET: async ({ params }) =>
        Response.json(await getRenderedPost({ data: params.postId })),
    },
  },
});
