import { bindings, defineConfig } from "cf/config";

export default defineConfig((ctx) => {
  // Previews use the staging database and buckets instead of production.
  const suffix = ctx.isPreview ? "-staging" : "";
  const databaseId = ctx.isPreview
    ? "5c3074de-26f0-4dec-8b18-896d1e7476e7"
    : "9b0b56cc-daed-4e61-b4d2-a8ba33da1286";

  return {
    worker: {
      name: "cms",
      compatibilityDate: "2025-09-02",
      compatibilityFlags: ["nodejs_compat"],
      entrypoint: "@tanstack/react-start/server-entry",
      workersDev: true,
      previewUrls: true,
      observability: {
        enabled: true,
      },
      env: {
        CF_ACCESS_TEAM_DOMAIN: bindings.text("https://georgeblack.cloudflareaccess.com"),
        CF_ACCESS_AUD: bindings.text(
          "062182c55c618311c41f164d20cc413d0637fc013d720108750a9e66155bd657",
        ),
        WEB_DB: bindings.d1({
          name: `web${suffix}`,
          id: databaseId,
          dev: {
            remote: true,
          },
        }),
        WEB_FILES: bindings.r2({
          name: `web-files${suffix}`,
        }),
        WEB_FILES_CACHE: bindings.r2({
          name: `web-files-cache${suffix}`,
        }),
        IMAGES: bindings.images({}),
      },
    },
  };
});
