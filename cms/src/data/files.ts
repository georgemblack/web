import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import * as queries from "./queries";
import type { FileType, ListFilesFilters, WebFile } from "./types";

const OPTIMIZED_IMAGE_FORMAT = "image/avif";
const OPTIMIZED_IMAGE_WIDTH = 1200;
const CACHE_CONTROL = "public, max-age=31536000";

export const listFiles = createServerFn({ method: "GET" })
  .inputValidator((filters: ListFilesFilters) => filters)
  .handler(async ({ data: filters }): Promise<WebFile[]> => {
    return queries.listFiles(env.WEB_DB, filters);
  });

export const uploadFile = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
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
      optimize: optimizeRaw === "true",
    };
  })
  .handler(async ({ data: { file, title, type, year, optimize } }) => {
    const formattedTitle = title.toLowerCase().split(/\s+/).join("-");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const key = `${formattedTitle}.${extension}`;

    if (optimize) {
      const optimized = await env.IMAGES.input(file.stream())
        .transform({ width: OPTIMIZED_IMAGE_WIDTH })
        .output({ format: OPTIMIZED_IMAGE_FORMAT });

      await env.WEB_FILES_CACHE.put(key, optimized.image(), {
        httpMetadata: {
          contentType: optimized.contentType(),
          cacheControl: CACHE_CONTROL,
        },
      });
    }

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
  .inputValidator((key: string) => key)
  .handler(async ({ data: key }) => {
    const exists = await env.WEB_FILES_CACHE.head(key);
    if (exists) {
      await env.WEB_FILES_CACHE.delete(key);
      await queries.updateFileOptimized(env.WEB_DB, key, false);
      return { optimized: false };
    }

    const original = await env.WEB_FILES.get(key);
    if (!original) {
      throw new Error("File not found");
    }

    const optimized = await env.IMAGES.input(original.body)
      .transform({ width: OPTIMIZED_IMAGE_WIDTH })
      .output({ format: OPTIMIZED_IMAGE_FORMAT });

    await env.WEB_FILES_CACHE.put(key, optimized.image(), {
      httpMetadata: {
        contentType: optimized.contentType(),
        cacheControl: CACHE_CONTROL,
      },
    });

    await queries.updateFileOptimized(env.WEB_DB, key, true);

    return { optimized: true };
  });

export const uploadOptimizedFile = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    const file = data.get("file");
    const key = data.get("key");
    if (!(file instanceof File)) throw new Error("file is required");
    if (typeof key !== "string") throw new Error("key is required");
    return { file, key };
  })
  .handler(async ({ data: { file, key } }) => {
    const exists = await env.WEB_FILES_CACHE.head(key);
    if (exists) {
      throw new Error("An optimized version already exists for this file");
    }

    await env.WEB_FILES_CACHE.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: CACHE_CONTROL,
      },
    });

    await queries.updateFileOptimized(env.WEB_DB, key, true);

    return { key };
  });

export const deleteFile = createServerFn({ method: "POST" })
  .inputValidator((key: string) => key)
  .handler(async ({ data: key }) => {
    await env.WEB_FILES.delete(key);
    await env.WEB_FILES_CACHE.delete(key);
    await queries.deleteFile(env.WEB_DB, key);
    return { deleted: true };
  });
