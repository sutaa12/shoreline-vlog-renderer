import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  collectPageIssues,
  directoryIdentity,
  filesIdentity,
  launchRealChrome,
  sha256File,
  startPreview,
  stopPreview,
  waitForTerminalState,
} from "./harness.mjs";

const FRAME_COUNT = 720;
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const artifactDirectory = "artifacts/iteration-02";
const anchorDirectory = `${artifactDirectory}/anchors`;
const videoPath = `${artifactDirectory}/shoreline-loop.mp4`;
const contactSheetPath = `${artifactDirectory}/contact-sheet.png`;
const manifestPath = `${artifactDirectory}/capture-manifest.json`;
const port = Number(process.env.SHORELINE_PORT ?? 4175);
const anchors = new Map([
  [0, "establishing"],
  [210, "follow"],
  [390, "close-up"],
  [480, "quiet-gaze"],
  [690, "return"],
]);

await mkdir(anchorDirectory, { recursive: true });
const preview = await startPreview(port);
const browser = await launchRealChrome();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
});
const pageIssues = collectPageIssues(page);
const anchorRecords = [];
let ffmpegLog = "";

function commandVersion(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) return `unavailable (exit ${result.status})`;
  return (result.stdout || result.stderr).split("\n")[0].trim();
}

function combinedHash(records) {
  const hash = createHash("sha256");
  records.forEach((record) => hash.update(`${record.path}\0${record.sha256}\0`));
  return hash.digest("hex");
}

async function sampleCanvas(pageInstance) {
  return pageInstance.evaluate(() => {
    const canvas = document.querySelector("#shoreline-canvas");
    const gl = canvas.getContext("webgl2");
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let count = 0;
    let sum = 0;
    let sumSquares = 0;
    let minimum = 255;
    let maximum = 0;
    for (let offset = 0; offset < pixels.length; offset += 4 * 64) {
      const luma = pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722;
      sum += luma;
      sumSquares += luma * luma;
      minimum = Math.min(minimum, luma);
      maximum = Math.max(maximum, luma);
      count += 1;
    }
    const mean = sum / count;
    return {
      width: canvas.width,
      height: canvas.height,
      samples: count,
      meanLuma: mean,
      lumaStandardDeviation: Math.sqrt(Math.max(0, sumSquares / count - mean * mean)),
      minimumLuma: minimum,
      maximumLuma: maximum,
    };
  });
}

function writeToPipe(stream, buffer) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      stream.off("drain", onDrain);
      reject(error);
    };
    const onDrain = () => {
      stream.off("error", onError);
      resolve();
    };
    stream.once("error", onError);
    if (stream.write(buffer)) {
      stream.off("error", onError);
      resolve();
    } else {
      stream.once("drain", onDrain);
    }
  });
}

try {
  await page.goto(`${preview.url}/?capture=1&quality=high`, { waitUntil: "domcontentloaded" });
  const runtime = await waitForTerminalState(page);
  assert.equal(runtime.state, "ready", `Capture requires ready state, received ${runtime.state}`);
  assert.equal(runtime.diagnostics.output.bufferWidth, WIDTH);
  assert.equal(runtime.diagnostics.output.bufferHeight, HEIGHT);

  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "-framerate",
      String(FPS),
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-fps_mode",
      "cfr",
      "-frames:v",
      String(FRAME_COUNT),
      "-movflags",
      "+faststart",
      videoPath,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  ffmpeg.stderr.on("data", (chunk) => {
    ffmpegLog += chunk.toString();
  });
  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpeg.once("error", reject);
    ffmpeg.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${ffmpegLog}`));
    });
  });

  const canvasLocator = page.locator("#shoreline-canvas");
  for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
    const renderResult = await page.evaluate(
      (frameIndex) => window.__SHORELINE__.renderFrame(frameIndex),
      frame,
    );
    assert.equal(renderResult.frame, frame);
    assert.equal(renderResult.time, frame / FPS);
    const png = await canvasLocator.screenshot({ type: "png" });
    await writeToPipe(ffmpeg.stdin, png);

    if (anchors.has(frame)) {
      const label = anchors.get(frame);
      const path = `${anchorDirectory}/frame-${String(frame).padStart(4, "0")}-${label}.png`;
      await writeFile(path, png);
      const pixels = await sampleCanvas(page);
      assert.equal(pixels.width, WIDTH);
      assert.equal(pixels.height, HEIGHT);
      assert.ok(pixels.lumaStandardDeviation > 12, `${path} is too uniform`);
      assert.ok(pixels.maximumLuma - pixels.minimumLuma > 45, `${path} lacks tonal range`);
      anchorRecords.push({
        frame,
        timeSeconds: frame / FPS,
        label,
        path,
        sha256: await sha256File(path),
        pixels,
        runtime: renderResult,
      });
    }

    if (frame % 60 === 59) {
      process.stdout.write(`captured ${frame + 1}/${FRAME_COUNT} browser frames\n`);
    }
  }
  ffmpeg.stdin.end();
  await ffmpegDone;

  const contactSheet = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-pattern_type",
      "glob",
      "-i",
      `${anchorDirectory}/frame-*.png`,
      "-vf",
      "scale=384:216:flags=lanczos,tile=5x1",
      "-frames:v",
      "1",
      contactSheetPath,
    ],
    { encoding: "utf8" },
  );
  assert.equal(contactSheet.status, 0, contactSheet.stderr);

  const probe = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-count_frames",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,r_frame_rate,avg_frame_rate,nb_read_frames,duration",
      "-show_entries",
      "format=duration",
      "-of",
      "json",
      videoPath,
    ],
    { encoding: "utf8" },
  );
  assert.equal(probe.status, 0, probe.stderr);
  const probeData = JSON.parse(probe.stdout);
  const stream = probeData.streams[0];
  assert.equal(stream.width, WIDTH);
  assert.equal(stream.height, HEIGHT);
  assert.equal(stream.r_frame_rate, "30/1");
  assert.equal(stream.avg_frame_rate, "30/1");
  assert.equal(Number(stream.nb_read_frames), FRAME_COUNT);
  assert.equal(Number(stream.duration), 24);
  assert.equal(Number(probeData.format.duration), 24);
  await writeFile(`${artifactDirectory}/ffprobe.json`, `${JSON.stringify(probeData, null, 2)}\n`);

  assert.deepEqual(pageIssues, [], `Unexpected browser issues: ${JSON.stringify(pageIssues)}`);
  const sourceFiles = await filesIdentity([
    "index.html",
    "package.json",
    "package-lock.json",
    "src/character.js",
    "src/environment.js",
    "src/main.js",
    "src/styles.css",
    "src/timeline.js",
  ]);
  const build = await directoryIdentity("dist");
  const manifest = {
    schemaVersion: 1,
    capture: {
      renderer: "Playwright canvas PNG stream to ffmpeg",
      frameStart: 0,
      frameEnd: 719,
      frameCount: FRAME_COUNT,
      fps: FPS,
      timeRule: "t = frame / 30",
      width: WIDTH,
      height: HEIGHT,
      codec: "H.264 / yuv420p / CFR",
    },
    sourceIdentity: sourceFiles,
    buildIdentity: build,
    assets: {
      plate: {
        path: "public/assets/environment/shoreline-plate.webp",
        sha256: await sha256File("public/assets/environment/shoreline-plate.webp"),
      },
      vrm: {
        path: "public/assets/character.vrm",
        sha256: await sha256File("public/assets/character.vrm"),
      },
    },
    tools: {
      node: process.version,
      npm: commandVersion("npm", ["--version"]),
      ffmpeg: commandVersion("ffmpeg", ["-version"]),
      ffprobe: commandVersion("ffprobe", ["-version"]),
      browser: { name: "Google Chrome", version: browser.version() },
    },
    runtime: {
      state: runtime.state,
      systems: runtime.systems,
      renderer: runtime.diagnostics.renderer,
      output: runtime.diagnostics.output,
      character: runtime.diagnostics.character,
      environment: runtime.diagnostics.environment,
    },
    anchors: anchorRecords,
    contactSheet: {
      path: contactSheetPath,
      sha256: await sha256File(contactSheetPath),
    },
    video: {
      path: videoPath,
      sha256: await sha256File(videoPath),
      ffprobe: probeData,
    },
    browserIssues: pageIssues,
    loopContinuity: {
      pureTimelineStartEqualsEnd: true,
      verifiedBy: "tests/timeline.test.mjs",
    },
  };
  manifest.sourceIdentity.combinedSha256 = combinedHash(manifest.sourceIdentity.files);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({
      video: videoPath,
      frames: Number(stream.nb_read_frames),
      duration: Number(stream.duration),
      anchors: anchorRecords.length,
      manifest: manifestPath,
    })}\n`,
  );
} finally {
  await page.close();
  await browser.close();
  await stopPreview(preview.process);
}
