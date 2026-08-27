import { expect, test } from "@playwright/test";

test("production runtime reaches ready with a live VRM and complete scene", async ({ page }) => {
  const fatalConsoleMessages: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") fatalConsoleMessages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => fatalConsoleMessages.push(`page: ${error.message}`));

  const response = await page.goto("/?quality=fallback", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect(page.locator(".status-card")).toHaveAttribute("data-state", "ready", { timeout: 30_000 });

  const firstFrame = await page.evaluate(() => window.__SHORELINE__.frame);
  await expect.poll(() => page.evaluate(() => window.__SHORELINE__.frame)).not.toBe(firstFrame);

  const runtime = await page.evaluate(() => {
    const value = window.__SHORELINE__;
    return {
      status: value.status,
      frame: value.frame,
      vrmLoaded: value.vrmLoaded,
      vrmAssetUrl: value.vrmAssetUrl,
      modelName: value.vrmModelName,
      mtoon: value.vrmMToonMaterialCount,
      outlines: value.vrmNativeOutlineMaterialCount,
      outlineMode: value.vrmOutlineMode,
      skinnedMeshes: value.vrmSkinnedMeshCount,
      springBones: value.springBonesSupported,
      springUpdates: value.springUpdateCount,
      expressions: value.expressionsSupported,
      systems: value.requiredSystems,
      rockCount: value.rockCount,
      errors: value.errors,
      statusKinds: value.statusKinds,
    };
  });

  expect(runtime.status).toBe("ready");
  expect(runtime.vrmLoaded).toBe(true);
  expect(runtime.vrmAssetUrl).toBe("/assets/character.vrm");
  expect(runtime.modelName).toContain("Constraint_Twist_Sample");
  expect(runtime.mtoon).toBeGreaterThan(0);
  expect(runtime.outlines).toBeGreaterThan(0);
  expect(runtime.outlineMode).toBe("mtoon-native");
  expect(runtime.skinnedMeshes).toBeGreaterThan(0);
  expect(runtime.springBones).toBe(true);
  expect(runtime.springUpdates).toBeGreaterThan(0);
  expect(runtime.expressions).toBe(true);
  expect(runtime.rockCount).toBeGreaterThanOrEqual(20);
  expect(runtime.systems).not.toBeNull();
  expect(Object.values(runtime.systems ?? {}).every(Boolean)).toBe(true);
  expect(runtime.errors).toEqual([]);
  expect(runtime.statusKinds).toEqual(["loading", "ready", "degraded", "fatal"]);
  expect(fatalConsoleMessages).toEqual([]);
});
