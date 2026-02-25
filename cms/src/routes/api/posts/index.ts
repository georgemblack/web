import { createPost, listPosts } from "@/data/db";
import { PostStatus } from "@/data/types";
import { createFileRoute } from "@tanstack/react-router";

const validStates: PostStatus[] = ["draft", "published"];

export const Route = createFileRoute("/api/posts/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const hiddenParam = url.searchParams.get("hidden");
        const stateParam = url.searchParams.get("state");

        let hidden: boolean | undefined;
        if (hiddenParam !== null) {
          if (hiddenParam !== "true" && hiddenParam !== "false") {
            return Response.json(
              {
                error:
                  "Invalid value for 'hidden'. Expected 'true' or 'false'.",
              },
              { status: 400 },
            );
          }
          hidden = hiddenParam === "true";
        }

        let state: PostStatus | undefined;
        if (stateParam !== null) {
          if (!validStates.includes(stateParam as PostStatus)) {
            return Response.json(
              {
                error: `Invalid value for 'state'. Expected one of: ${validStates.join(", ")}.`,
              },
              { status: 400 },
            );
          }
          state = stateParam as PostStatus;
        }

        return Response.json(await listPosts({ data: { hidden, state } }));
      },
      POST: async ({ request }) => {
        const post = await createPost({
          data: await request.json(),
        });
        return Response.json(post, { status: 201 });
      },
    },
  },
});
