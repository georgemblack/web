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
    ignorePatterns: ["*.gen.ts", "pnpm-lock.yaml", "worker-configuration.d.ts"],
  },
  lint: {
    ignorePatterns: ["*.gen.ts", "worker-configuration.d.ts"],
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
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ];
  }),
});

export default config;
