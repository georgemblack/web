import { createContext, useContext } from "react";

import type { FileType, WebFile } from "@/data/types";

export const FilesContext = createContext<WebFile[]>([]);

export function useFilesOfType(type: FileType): string[] {
  const files = useContext(FilesContext);
  return files.filter((f) => f.type === type).map((f) => f.key);
}
