import { deletePost, getPost } from "@/data/db";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/posts/$postId/")({
  server: {
    handlers: {
      GET: async ({ params }) =>
        Response.json(await getPost({ data: params.postId })),
      DELETE: async ({ params }) => {
        await deletePost({ data: params.postId });
        return new Response(null, { status: 204 });
      },
    },
  },
});
