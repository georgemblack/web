import { beforeEach, expect, it, vi } from "vite-plus/test";

import { serveFile } from "./files";

const first = vi.fn();
const bind = vi.fn(() => ({ first }));
const get = vi.fn();
const output = vi.fn();
const transform = vi.fn(() => ({ output }));
const input = vi.fn(() => ({ transform }));
const env = {
  WEB_DB: { prepare: vi.fn(() => ({ bind })) },
  WEB_FILES: { get },
  IMAGES: { input },
} as unknown as Env;

beforeEach(() => {
  vi.clearAllMocks();
  first.mockResolvedValue({ type: "IMAGE", optimize: 1 });
  get.mockImplementation(() =>
    Promise.resolve({
      body: new Response("original").body,
      httpEtag: '"original-etag"',
      writeHttpMetadata(headers: Headers) {
        headers.set("Content-Type", "image/jpeg");
        headers.set("Cache-Control", "public, max-age=31536000");
      },
    }),
  );
  output.mockImplementation(() =>
    Promise.resolve({
      contentType: () => "image/avif",
      image: () => new Response("optimized").body,
    }),
  );
});

function request(method = "GET", key = "photo.jpg") {
  return new Request(`https://george.black/files/${key}`, { method });
}

it("optimizes enabled images and caches the AVIF response for seven days", async () => {
  const response = await serveFile(request(), env);
  expect(await response.text()).toBe("optimized");
  expect(response.headers.get("Content-Type")).toBe("image/avif");
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=604800");
  expect(response.headers.has("ETag")).toBe(false);
  expect(transform).toHaveBeenCalledWith({ width: 1200 });
  expect(output).toHaveBeenCalledWith({ format: "image/avif" });
});

it.each([
  { type: "IMAGE", optimize: 0 },
  { type: "DOCUMENT", optimize: 1 },
  { type: "VIDEO", optimize: 1 },
  null,
])("serves original bytes without transforming for %j", async (record) => {
  first.mockResolvedValue(record);
  const response = await serveFile(request(), env);
  expect(await response.text()).toBe("original");
  expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  expect(response.headers.get("ETag")).toBe('"original-etag"');
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=604800");
  expect(input).not.toHaveBeenCalled();
});

it("decodes the same object key for D1 and R2", async () => {
  await serveFile(request("GET", "my%20photo.jpg"), env);
  expect(bind).toHaveBeenCalledWith("my photo.jpg");
  expect(get).toHaveBeenCalledWith("my photo.jpg");
});

it("returns a cached 404 when the original is missing", async () => {
  get.mockResolvedValue(null);
  const response = await serveFile(request(), env);
  expect(response.status).toBe(404);
  expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
  expect(input).not.toHaveBeenCalled();
});

it.each([0, 1])(
  "HEAD returns the same content type without a body (optimize=%i)",
  async (optimize) => {
    first.mockResolvedValue({ type: "IMAGE", optimize });
    const response = await serveFile(request("HEAD"), env);
    expect(response.body).toBe(null);
    expect(response.headers.get("Content-Type")).toBe(optimize ? "image/avif" : "image/jpeg");
  },
);

it("rejects unsupported methods without accessing storage", async () => {
  const response = await serveFile(request("POST"), env);
  expect(response.status).toBe(405);
  expect(get).not.toHaveBeenCalled();
  expect(first).not.toHaveBeenCalled();
});

it("does not cache transformation failures", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    output.mockRejectedValueOnce(new Error("Images unavailable"));
    const response = await serveFile(request(), env);
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  } finally {
    log.mockRestore();
  }
});
