import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createPost, listPosts, getPost, updatePost } from "@/data/db";
import { listFiles, uploadFile } from "@/data/files";
import { Button, Input } from "@cloudflare/kumo";
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

  const [isCheckingImages, setIsCheckingImages] = useState(false);
  const [invalidImages, setInvalidImages] = useState<
    { postTitle: string; postId: string; url: string }[] | null
  >(null);

  const handleCheckImages = async () => {
    setIsCheckingImages(true);
    setInvalidImages(null);

    try {
      const [posts, files] = await Promise.all([
        listPosts({ data: undefined }),
        listFiles(),
      ]);

      const fileSet = new Set(
        files.map((f) => `https://george.black/files/${f.fileName}`),
      );

      const results: { postTitle: string; postId: string; url: string }[] = [];

      for (const item of posts) {
        const post = await getPost({ data: item.id });
        if (!post) continue;
        for (const block of post.content) {
          if (block.type === "image" || block.type === "video") {
            if (!fileSet.has(block.url)) {
              results.push({
                postTitle: post.title,
                postId: post.id,
                url: block.url,
              });
            }
          }
        }
      }

      setInvalidImages(results);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to check images: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsCheckingImages(false);
    }
  };

  const [isMigrating, setIsMigrating] = useState(false);
  const [migratedUrls, setMigratedUrls] = useState<
    { postTitle: string; postId: string; oldUrl: string; newUrl: string }[] | null
  >(null);

  const handleMigrateUrls = async () => {
    setIsMigrating(true);
    setMigratedUrls(null);

    try {
      const posts = await listPosts({ data: undefined });
      const results: {
        postTitle: string;
        postId: string;
        oldUrl: string;
        newUrl: string;
      }[] = [];

      const OLD_PREFIX = "https://files.george.black/";
      const NEW_PREFIX = "https://george.black/files/";

      for (const item of posts) {
        const post = await getPost({ data: item.id });
        if (!post) continue;

        let changed = false;
        const updatedContent = post.content.map((block) => {
          if (
            (block.type === "image" || block.type === "video") &&
            block.url.startsWith(OLD_PREFIX)
          ) {
            const newUrl = NEW_PREFIX + block.url.slice(OLD_PREFIX.length);
            results.push({
              postTitle: post.title,
              postId: post.id,
              oldUrl: block.url,
              newUrl,
            });
            changed = true;
            return { ...block, url: newUrl };
          }
          return block;
        });

        if (changed) {
          await updatePost({
            data: {
              id: post.id,
              title: post.title,
              published: post.published,
              slug: post.slug,
              status: post.status,
              hidden: post.hidden,
              gallery: post.gallery,
              content: updatedContent,
              external_link: post.external_link,
            },
          });
        }
      }

      setMigratedUrls(results);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Failed to migrate URLs: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      <div className="space-y-4">
        <Button onClick={handleGeneratePost} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Random Post"}
        </Button>
        <Button onClick={handleCheckImages} disabled={isCheckingImages}>
          {isCheckingImages ? "Checking..." : "Find Invalid Image URLs"}
        </Button>
        <Button onClick={handleMigrateUrls} disabled={isMigrating}>
          {isMigrating ? "Migrating..." : "Migrate Legacy Image URLs"}
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
        {invalidImages !== null && (
          <div>
            <h2 className="text-lg font-semibold mt-4 mb-2">
              Image URLs Without a File ({invalidImages.length})
            </h2>
            {invalidImages.length === 0 ? (
              <p className="text-green-600">
                All image URLs map to an existing file.
              </p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {invalidImages.map((img, i) => (
                  <li key={i}>
                    <Link to="/posts/$postId" params={{ postId: img.postId }} className="font-bold underline">{img.postTitle}</Link>: <code>{img.url}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <hr className="my-6 border-gray-300" />
        <h2 className="text-lg font-semibold mb-2">Bulk File Upload</h2>
        <BulkUploadForm />

        {migratedUrls !== null && (
          <div>
            <h2 className="text-lg font-semibold mt-4 mb-2">
              Migrated Image URLs ({migratedUrls.length})
            </h2>
            {migratedUrls.length === 0 ? (
              <p className="text-green-600">No legacy URLs found.</p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {migratedUrls.map((item, i) => (
                  <li key={i}>
                    <Link
                      to="/posts/$postId"
                      params={{ postId: item.postId }}
                      className="font-bold underline"
                    >
                      {item.postTitle}
                    </Link>
                    : <code>{item.oldUrl}</code> → <code>{item.newUrl}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const currentYear = new Date().getFullYear();

function BulkUploadForm() {
  const [year, setYear] = useState(String(currentYear));
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<
    { name: string; status: "success" | "error"; message: string }[]
  >([]);

  const handleUpload = async () => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setResults([]);

    const uploadResults: {
      name: string;
      status: "success" | "error";
      message: string;
    }[] = [];

    for (const file of Array.from(files)) {
      const title = file.name.replace(/\.[^.]+$/, "");
      const formData = new FormData();
      formData.append("year", year);
      formData.append("title", title);
      formData.append("file", file);
      formData.append("optimize", "on");

      try {
        const result = await uploadFile({ data: formData });
        uploadResults.push({
          name: file.name,
          status: "success",
          message: result.key,
        });
      } catch (error) {
        uploadResults.push({
          name: file.name,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    setResults(uploadResults);
    setIsUploading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          className="w-24"
          placeholder="Year"
          aria-label="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
      </div>
      <Button
        onClick={handleUpload}
        disabled={isUploading || !files || files.length === 0}
      >
        {isUploading ? "Uploading..." : "Upload Files"}
      </Button>
      {results.length > 0 && (
        <ul className="list-disc pl-6 space-y-1">
          {results.map((r, i) => (
            <li
              key={i}
              className={
                r.status === "success" ? "text-green-600" : "text-red-600"
              }
            >
              {r.name}: {r.status === "success" ? r.message : `Error: ${r.message}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
