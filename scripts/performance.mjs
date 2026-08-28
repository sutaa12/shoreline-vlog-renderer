import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  collectPageIssues,
  launchRealChrome,
  startPreview,
  stopPreview,
  waitForTerminalState,
} from "./harness.mjs";

const artifactDirectory = "artifacts/iteration-02";
const port = Number(process.env.SHORELINE_PORT ?? 4176);
await mkdir(artifactDirectory, { recursive: true });
const preview = await startPreview(port);
const browser = await launchRealChrome();

async function measure(quality) {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const issues = collectPageIssues(page);
  try {
    await page.goto(`${preview.url}/?quality=${quality}`, { waitUntil: "domcontentloaded" });
    const runtime = await waitForTerminalState(page);
    assert.equal(runtime.state, "ready");
    const samples = await page.evaluate(
      ({ warmupFrames, sampleFrames }) =>
        new Promise((resolve) => {
          const deltas = [];
          let frame = 0;
          let previous;
          function tick(now) {
            if (previous !== undefined && frame >= warmupFrames) deltas.push(now - previous);
            previous = now;
            frame += 1;
            if (deltas.length >= sampleFrames) resolve(deltas);
            else requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }),
      { warmupFrames: 120, sampleFrames: 360 },
    );
    const sorted = [...samples].sort((a, b) => a - b);
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const maximum = sorted.at(-1);
    return {
      quality,
      browser: { name: "Google Chrome", version: browser.version() },
      runtime: {
        renderer: runtime.diagnostics.renderer,
        output: runtime.diagnostics.output,
      },
      warmupFrames: 120,
      sampleFrames: samples.length,
      meanFrameDeltaMs: mean,
      p95FrameDeltaMs: p95,
      maximumFrameDeltaMs: maximum,
      effectiveFps: 1000 / mean,
      postWarmupStallsOver100Ms: samples.filter((value) => value > 100).length,
      meets1080pTarget:
        runtime.diagnostics.output.bufferWidth === 1920 &&
        runtime.diagnostics.output.bufferHeight === 1080 &&
        1000 / mean >= 30 &&
        p95 <= 33.4 &&
        maximum <= 100,
      issues,
    };
  } finally {
    await page.close();
  }
}

const report = {
  schemaVersion: 1,
  target: {
    width: 1920,
    height: 1080,
    minimumEffectiveFps: 30,
    maximumP95FrameDeltaMs: 33.4,
    maximumPostWarmupStallMs: 100,
  },
  runs: [],
  correction: null,
};

try {
  const high = await measure("high");
  report.runs.push(high);
  assert.deepEqual(high.issues, []);
  if (!high.meets1080pTarget) {
    const balanced = await measure("balanced");
    report.runs.push(balanced);
    report.correction = {
      applied: true,
      change: "Reduced pixel ratio, shadow-map resolution, and foreground mesh density; retained every required scene system.",
      highMeetsTarget: false,
      balancedMeetsTarget: balanced.meets1080pTarget,
    };
    assert.deepEqual(balanced.issues, []);
  } else {
    report.correction = { applied: false, reason: "High quality met the 1080p target." };
  }
  report.passed = report.runs.some((run) => run.meets1080pTarget);
  await writeFile(
    `${artifactDirectory}/performance.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.ok(report.passed, "No measured quality mode met the 1080p target.");
  process.stdout.write(
    `${JSON.stringify({
      passed: report.passed,
      quality: report.runs.find((run) => run.meets1080pTarget)?.quality,
      p95FrameDeltaMs: report.runs.find((run) => run.meets1080pTarget)?.p95FrameDeltaMs,
      effectiveFps: report.runs.find((run) => run.meets1080pTarget)?.effectiveFps,
    })}\n`,
  );
} finally {
  await browser.close();
  await stopPreview(preview.process);
}
