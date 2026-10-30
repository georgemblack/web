import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { expect, it } from "vitest";

import { listFiles } from "./queries";
import type { ListFilesFilters } from "./types";

it.each<{ type: ListFilesFilters["type"]; expected: string[] }>([
  { type: "DOCUMENT", expected: ["document.pdf"] },
  { type: ["IMAGE", "VIDEO"], expected: ["image.jpg", "video.mp4"] },
  { type: "IMAGE", expected: ["image.jpg"] },
  { type: undefined, expected: ["document.pdf", "image.jpg", "video.mp4"] },
  { type: [], expected: [] },
])(
  "lists the requested file types ($type) within the selected year",
  async ({ type, expected }) => {
    const sqlite = new DatabaseSync(":memory:");
    try {
      for (const migration of ["001_initial_schema.sql", "004_rename_optimized_to_optimize.sql"]) {
        sqlite.exec(
          readFileSync(new URL(`../../migrations/${migration}`, import.meta.url), "utf8"),
        );
      }
      sqlite.exec(`
      INSERT INTO files (key, type, year, optimize) VALUES
        ('video.mp4', 'VIDEO', 2026, 0),
        ('document.pdf', 'DOCUMENT', 2026, 0),
        ('image.jpg', 'IMAGE', 2026, 1),
        ('older-image.jpg', 'IMAGE', 2025, 0),
        ('older-document.pdf', 'DOCUMENT', 2025, 0);
    `);
      const db = {
        prepare: (sql: string) => ({
          bind: (...bindings: (string | number)[]) => ({
            all: async () => ({ results: sqlite.prepare(sql).all(...bindings) }),
          }),
        }),
      } as unknown as D1Database;

      const files = await listFiles(db, { year: 2026, type });
      expect(files.map((file) => file.key)).toEqual(expected);
      for (const file of files) {
        expect(file.optimize).toBe(file.key === "image.jpg");
      }
    } finally {
      sqlite.close();
    }
  },
);
