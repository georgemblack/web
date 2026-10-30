import { beforeEach, expect, it, vi } from "vitest";

import { deleteFile, toggleOptimize } from "./files";
import * as queries from "./queries";

const { env } = vi.hoisted(() => ({
  env: { WEB_DB: {}, WEB_FILES: { delete: vi.fn() } },
}));
vi.mock("cloudflare:workers", () => ({ env }));
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
vi.mock("./queries", () => ({ toggleFileOptimize: vi.fn(), deleteFile: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

it.each([true, false])(
  "toggles the D1 preference to %s without processing objects",
  async (optimize) => {
    vi.mocked(queries.toggleFileOptimize).mockResolvedValue(optimize);
    expect(await toggleOptimize({ data: "photo.jpg" })).toEqual({ optimize });
    expect(queries.toggleFileOptimize).toHaveBeenCalledExactlyOnceWith(env.WEB_DB, "photo.jpg");
    expect(env.WEB_FILES.delete).not.toHaveBeenCalled();
  },
);

it("rejects missing images or non-image files", async () => {
  vi.mocked(queries.toggleFileOptimize).mockRejectedValue(new Error("Image not found"));
  await expect(toggleOptimize({ data: "document.pdf" })).rejects.toThrow("Image not found");
});

it("deletes only the original and its D1 record", async () => {
  expect(await deleteFile({ data: "photo.jpg" })).toEqual({ deleted: true });
  expect(env.WEB_FILES.delete).toHaveBeenCalledExactlyOnceWith("photo.jpg");
  expect(queries.deleteFile).toHaveBeenCalledExactlyOnceWith(env.WEB_DB, "photo.jpg");
});
