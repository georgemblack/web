import { FILE_CACHE_CONTROL, FILE_NOT_FOUND_CACHE_CONTROL } from "../util/Cache";

interface FileRow {
  type: string;
  optimize: number;
}

export async function serveFile(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  let key: string;
  try {
    key = decodeURIComponent(new URL(request.url).pathname.slice("/files/".length));
  } catch {
    return new Response("Invalid file path", { status: 400 });
  }

  const [file, object] = await Promise.all([
    env.WEB_DB.prepare("SELECT type, optimize FROM files WHERE key = ?").bind(key).first<FileRow>(),
    env.WEB_FILES.get(key),
  ]);

  const headers = new Headers({
    "Cache-Control": FILE_CACHE_CONTROL,
  });
  if (!object) {
    headers.set("Cache-Control", FILE_NOT_FOUND_CACHE_CONTROL);
    return new Response(request.method === "HEAD" ? null : "Not Found", { status: 404, headers });
  }

  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", FILE_CACHE_CONTROL);

  if (file?.type === "IMAGE" && file.optimize === 1) {
    try {
      const optimized = await env.IMAGES.input(object.body)
        .transform({ width: 1200 })
        .output({ format: "image/avif" });
      headers.set("Content-Type", optimized.contentType());
      return new Response(request.method === "HEAD" ? null : optimized.image(), { headers });
    } catch (error) {
      console.error("Image optimization failed", { key, error });
      return new Response(request.method === "HEAD" ? null : "Image optimization failed", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }
  }

  headers.set("ETag", object.httpEtag);
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
