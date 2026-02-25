import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createPost } from "@/data/db";
import { Button } from "@cloudflare/kumo";
import type { ContentBlock } from "@/data/types";

export const Route = createFileRoute("/debug/")({
  component: RouteComponent,
});

const LOREM_PARAGRAPHS = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra.",
];

function generateRandomPost() {
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const title = `Debug Post ${randomId}`;
  const slug = `debug-post-${randomId}`;
  const now = new Date().toISOString();

  const blockCount = 1 + Math.floor(Math.random() * 3);
  const markdownBlocks: ContentBlock[] = Array.from(
    { length: blockCount },
    () => ({
      type: "markdown" as const,
      text: LOREM_PARAGRAPHS[
        Math.floor(Math.random() * LOREM_PARAGRAPHS.length)
      ],
    }),
  );

  return {
    title,
    slug,
    published: now,
    updated: now,
    status: "draft" as const,
    hidden: false,
    gallery: false,
    external_link: null,
    content: markdownBlocks,
  };
}

function RouteComponent() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const postData = generateRandomPost();
      const newPost = await createPost({ data: postData });
      setMessage({
        type: "success",
        text: `Created post: "${newPost.title}" (ID: ${newPost.id})`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to create post: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      <div className="space-y-4">
        <Button onClick={handleGeneratePost} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Random Post"}
        </Button>
        {message && (
          <p
            className={
              message.type === "success" ? "text-green-600" : "text-red-600"
            }
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
