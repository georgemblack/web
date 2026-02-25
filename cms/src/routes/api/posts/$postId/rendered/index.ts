import { getRenderedPost } from "@/data/db";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/posts/$postId/rendered/")({
  server: {
    handlers: {
      GET: async ({ params }) =>
        Response.json(await getRenderedPost({ data: params.postId })),
    },
  },
});
