import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, lazyPlugins } from "vite-plus";

const config = defineConfig({
  fmt: {
    importOrder: ["^(@/|[./])"],
    importOrderSeparation: true,
    sortPackageJson: false,
    sortTailwindcss: {},
    ignorePatterns: ["*.gen.ts", "pnpm-lock.yaml", ".cloudflare/**"],
  },
  lint: {
    ignorePatterns: ["*.gen.ts", ".cloudflare/**"],
    options: { typeAware: true, typeCheck: true },
  },
  test: { passWithNoTests: true },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: lazyPlugins(() => {
    if (process.env.VITEST) return [];

    return [
      devtools(),
      cloudflare({
        viteEnvironment: { name: "ssr" },
        // Read cloudflare.config.ts and write build output for the cf CLI.
        experimental: { newConfig: { cfBuildOutput: true, types: { generate: false } } },
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ];
  }),
});

export default config;
