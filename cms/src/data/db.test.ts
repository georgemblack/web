import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPost, deletePost, updatePost } from "./db";
import { purgePostCache } from "./post-cache";
import * as queries from "./queries";
import type { Post, PostStatus } from "./types";

vi.mock("cloudflare:workers", () => ({ env: { WEB_DB: {} } }));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => ({
    validator() {
      return this;
    },
    handler(handler: (input: unknown) => unknown) {
      return handler;
    },
  }),
}));
vi.mock("./queries", () => ({
  createPost: vi.fn(),
  getPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));
vi.mock("./post-cache", () => ({ purgePostCache: vi.fn() }));

function post(status: PostStatus): Post {
  return {
    id: "post-123",
    title: "Example",
    published: "2026-10-30T12:00:00.000Z",
    slug: "example",
    status,
    hidden: false,
    gallery: false,
    external_link: null,
    content: [],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("public post cache invalidation", () => {
  it.each(["draft", "published"] as const)("creates a %s post", async (status) => {
    const saved = post(status);
    vi.mocked(queries.createPost).mockResolvedValue(saved);
    await createPost({ data: saved });
    expect(purgePostCache).toHaveBeenCalledTimes(status === "published" ? 1 : 0);
    if (status === "published") expect(purgePostCache).toHaveBeenCalledWith(saved.id);
  });

  it.each([
    ["draft", "draft", false],
    ["draft", "published", true],
    ["published", "published", true],
    ["published", "draft", true],
  ] as const)("saves %s → %s", async (before, after, purge) => {
    const saved = post(after);
    vi.mocked(queries.getPost).mockResolvedValue(post(before));
    vi.mocked(queries.updatePost).mockResolvedValue(saved);
    await updatePost({ data: saved });
    expect(purgePostCache).toHaveBeenCalledTimes(purge ? 1 : 0);
    if (purge) {
      expect(purgePostCache).toHaveBeenCalledWith(saved.id);
      expect(vi.mocked(queries.updatePost).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(purgePostCache).mock.invocationCallOrder[0],
      );
    }
  });

  it.each(["draft", "published"] as const)("deletes a %s post", async (status) => {
    vi.mocked(queries.getPost).mockResolvedValue(post(status));
    vi.mocked(queries.deletePost).mockResolvedValue(true);
    await deletePost({ data: "post-123" });
    expect(purgePostCache).toHaveBeenCalledTimes(status === "published" ? 1 : 0);
  });

  it("does not purge when the database write fails", async () => {
    vi.mocked(queries.getPost).mockResolvedValue(post("published"));
    vi.mocked(queries.updatePost).mockRejectedValue(new Error("Database unavailable"));
    await expect(updatePost({ data: post("published") })).rejects.toThrow("Database unavailable");
    expect(purgePostCache).not.toHaveBeenCalled();
  });

  it("does not purge when the updated post does not exist", async () => {
    vi.mocked(queries.getPost).mockResolvedValue(null);
    vi.mocked(queries.updatePost).mockResolvedValue(null);
    await updatePost({ data: post("published") });
    expect(purgePostCache).not.toHaveBeenCalled();
  });
});
