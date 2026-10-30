import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import * as queries from "./queries";
import type { FileType, ListFilesFilters, WebFile } from "./types";

const CACHE_CONTROL = "public, max-age=31536000";

export const listFiles = createServerFn({ method: "GET" })
  .validator((filters: ListFilesFilters) => filters)
  .handler(async ({ data: filters }): Promise<WebFile[]> => {
    return queries.listFiles(env.WEB_DB, filters);
  });

export const uploadFile = createServerFn({ method: "POST" })
  .validator((data: FormData) => {
    const file = data.get("file");
    const title = data.get("title");
    const type = data.get("type");
    const yearRaw = data.get("year");
    const optimizeRaw = data.get("optimize");
    if (!(file instanceof File)) throw new Error("file is required");
    if (typeof title !== "string") throw new Error("title is required");
    if (typeof type !== "string") throw new Error("type is required");
    if (typeof yearRaw !== "string") throw new Error("year is required");
    return {
      file,
      title,
      type: type as FileType,
      year: Number(yearRaw),
      optimize: type === "IMAGE" && optimizeRaw === "true",
    };
  })
  .handler(async ({ data: { file, title, type, year, optimize } }) => {
    const formattedTitle = title.toLowerCase().split(/\s+/).join("-");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const key = `${formattedTitle}.${extension}`;

    await env.WEB_FILES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: CACHE_CONTROL,
      },
    });

    await queries.createFile(env.WEB_DB, key, type, year, optimize);

    return { key };
  });

export const toggleOptimize = createServerFn({ method: "POST" })
  .validator((key: string) => key)
  .handler(async ({ data: key }) => {
    const optimize = await queries.toggleFileOptimize(env.WEB_DB, key);
    return { optimize };
  });

export const deleteFile = createServerFn({ method: "POST" })
  .validator((key: string) => key)
  .handler(async ({ data: key }) => {
    await env.WEB_FILES.delete(key);
    await queries.deleteFile(env.WEB_DB, key);
    return { deleted: true };
  });
