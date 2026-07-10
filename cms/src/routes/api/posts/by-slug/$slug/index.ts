import { createFileRoute } from "@tanstack/react-router";

import { getRenderedPostBySlug } from "@/data/db";

export const Route = createFileRoute("/api/posts/by-slug/$slug/")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const post = await getRenderedPostBySlug({ data: params.slug });
        if (!post) {
          return new Response(null, { status: 404 });
        }
        return Response.json(post);
      },
    },
  },
});
