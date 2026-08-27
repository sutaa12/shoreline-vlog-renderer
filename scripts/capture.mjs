import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const artifactDirectory = resolve(root, "artifacts/iteration-01");
const videoPath = resolve(artifactDirectory, "shoreline-cinematic.webm");
const contactSheetPath = resolve(artifactDirectory, "contact-sheet.png");
const finalFramePath = resolve(artifactDirectory, "capture-complete.png");
const manifestPath = resolve(artifactDirectory, "capture-manifest.json");
const url = process.env.SHORELINE_CAPTURE_URL ?? "http://127.0.0.1:4174/?quality=capture";

await mkdir(artifactDirectory, { recursive: true });

function command(program, args, options = {}) {
  return new Promise((resolveCommand, rejectCommand) => {
    const child = spawn(program, args, { cwd: root, stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk; });
    child.stderr?.on("data", (chunk) => { stderr += chunk; });
    child.once("error", rejectCommand);
    child.once("exit", (code) => {
      if (code === 0) resolveCommand({ stdout, stderr });
      else rejectCommand(new Error(`${program} exited ${code}: ${stderr || stdout}`));
    });
  });
}

async function waitForServer(serverUrl, timeoutMilliseconds = 30_000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(serverUrl);
      if (response.ok) return;
    } catch {
      // The preview process needs a short startup window.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 120));
  }
  throw new Error(`Preview did not become available at ${serverUrl} within ${timeoutMilliseconds} ms.`);
}

const captureUrl = new URL(url);
const childEnvironment = { ...process.env };
delete childEnvironment.FORCE_COLOR;
delete childEnvironment.COLORTERM;
const preview = process.env.SHORELINE_CAPTURE_URL
  ? null
  : spawn("npm", ["run", "preview", "--", "--port", captureUrl.port || "4174"], {
      cwd: root,
      env: childEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });

let browser;
try {
  await waitForServer(captureUrl.origin);
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  if (!response?.ok()) throw new Error(`Capture page returned HTTP ${response?.status() ?? "unknown"}.`);
  await page.locator('.status-card[data-state="ready"]').waitFor({ timeout: 30_000 });
  const captureResult = await page.evaluate(() => window.__SHORELINE__.capture.start());
  await page.locator('[data-action="download"]:visible').waitFor({ timeout: 10_000 });
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="download"]').click();
  const download = await downloadPromise;
  await download.saveAs(videoPath);
  await page.screenshot({ path: finalFramePath });

  const runtime = await page.evaluate(() => {
    const value = window.__SHORELINE__;
    return {
      status: value.status,
      frame: value.frame,
      elapsedSeconds: value.elapsedSeconds,
      shot: value.shot,
      vrmLoaded: value.vrmLoaded,
      vrmModelName: value.vrmModelName,
      vrmMToonMaterialCount: value.vrmMToonMaterialCount,
      vrmNativeOutlineMaterialCount: value.vrmNativeOutlineMaterialCount,
      springBonesSupported: value.springBonesSupported,
      springUpdateCount: value.springUpdateCount,
      qualityTier: value.qualityTier,
      rockCount: value.rockCount,
      requiredSystems: value.requiredSystems,
      errors: value.errors,
      warnings: value.warnings,
      capture: {
        state: value.capture.state,
        authoredDurationSeconds: value.capture.authoredDurationSeconds,
        wallDurationSeconds: value.capture.wallDurationSeconds,
        bytes: value.capture.bytes,
        mimeType: value.capture.mimeType,
        renderedFrames: value.capture.renderedFrames,
      },
    };
  });

  if (runtime.status !== "ready" || runtime.errors.length > 0 || consoleErrors.length > 0 || pageErrors.length > 0) {
    throw new Error(`Capture runtime reported errors: ${JSON.stringify({ runtime: runtime.errors, consoleErrors, pageErrors })}`);
  }

  await command("ffmpeg", [
    "-y",
    "-i", videoPath,
    "-vf", "fps=1/4,scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2:color=#101719,tile=3x2:padding=8:margin=8",
    "-frames:v", "1",
    contactSheetPath,
  ]);
  const probe = await command("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration,size,bit_rate:stream=codec_name,width,height,avg_frame_rate",
    "-of", "json",
    videoPath,
  ]);
  const packetProbe = await command("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "packet=pts_time",
    "-of", "json",
    videoPath,
  ]);
  const packets = JSON.parse(packetProbe.stdout).packets ?? [];
  const lastPacketSeconds = Number(packets.at(-1)?.pts_time ?? 0);
  const videoBytes = await readFile(videoPath);
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    captureUrl: url,
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    captureResult,
    runtime,
    browserErrors: { console: consoleErrors, page: pageErrors },
    artifacts: {
      video: {
        path: "artifacts/iteration-01/shoreline-cinematic.webm",
        sha256: createHash("sha256").update(videoBytes).digest("hex"),
        probe: JSON.parse(probe.stdout),
        observedTimelineSeconds: lastPacketSeconds + 1 / 30,
      },
      contactSheet: "artifacts/iteration-01/contact-sheet.png",
      finalFrame: "artifacts/iteration-01/capture-complete.png",
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser?.close();
  if (preview) preview.kill("SIGTERM");
}
