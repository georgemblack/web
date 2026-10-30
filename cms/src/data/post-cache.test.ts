import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { purgePostCache } from "./post-cache";

const { env, purgePost } = vi.hoisted(() => {
  const purgePost = vi.fn();
  return { env: { WEB: { purgePost } as { purgePost: typeof purgePost } | undefined }, purgePost };
});
vi.mock("cloudflare:workers", () => ({ env }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  env.WEB = { purgePost };
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("purges through the web service binding", async () => {
  await purgePostCache("123");
  expect(purgePost).toHaveBeenCalledExactlyOnceWith("123");
});

it("skips production purges in CMS previews", async () => {
  env.WEB = undefined;
  await purgePostCache("123");
  expect(purgePost).not.toHaveBeenCalled();
});

it("retries a failed purge", async () => {
  purgePost.mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValue(undefined);
  const pending = purgePostCache("123");
  await vi.runAllTimersAsync();
  await pending;
  expect(purgePost).toHaveBeenCalledTimes(2);
});

it("reports a saved change separately from an exhausted purge failure", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  purgePost.mockRejectedValue(new Error("Unavailable"));
  const assertion = expect(purgePostCache("123")).rejects.toThrow("The post change was saved");
  await vi.runAllTimersAsync();
  await assertion;
  expect(purgePost).toHaveBeenCalledTimes(3);
});
