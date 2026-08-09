import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: ["*.gen.ts", "worker-configuration.d.ts"],
    options: { typeAware: true, typeCheck: true },
  },
  fmt: {
    importOrder: ["^(@/|[./])"],
    importOrderSeparation: true,
    sortPackageJson: false,
    ignorePatterns: ["*.gen.ts", "pnpm-lock.yaml", "worker-configuration.d.ts"],
  },
});
