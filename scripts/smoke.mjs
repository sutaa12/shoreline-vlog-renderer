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
const port = Number(process.env.SHORELINE_PORT ?? 4173);
await mkdir(artifactDirectory, { recursive: true });

const preview = await startPreview(port);
const browser = await launchRealChrome();
const report = {
  schemaVersion: 1,
  browser: { name: "Google Chrome", version: browser.version() },
  scenarios: [],
};

function unexpectedIssues(issues, blockedAssetScenario = false) {
  if (!blockedAssetScenario) return issues;
  return issues.filter(
    (issue) =>
      issue.type !== "console" ||
      !/^Failed to load resource: net::ERR_BLOCKED_BY_CLIENT/.test(issue.text),
  );
}

async function runScenario(name, configure, expectedState) {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const issues = collectPageIssues(page);
  try {
    if (configure) await configure(page);
    await page.goto(`${preview.url}/?capture=1`, { waitUntil: "domcontentloaded" });
    const runtime = await waitForTerminalState(page);
    assert.equal(runtime.state, expectedState);
    const scenario = { name, expectedState, runtime, issues };
    report.scenarios.push(scenario);
    return { page, runtime, issues, scenario };
  } catch (error) {
    await page.close();
    throw error;
  }
}

try {
  const ready = await runScenario("ready", null, "ready");
  assert.deepEqual(
    ready.runtime.systems,
    Object.fromEntries(Object.keys(ready.runtime.systems).map((key) => [key, true])),
  );
  assert.equal(ready.runtime.capture.frameCount, 720);
  assert.equal(ready.runtime.capture.fps, 30);
  assert.equal(ready.runtime.diagnostics.output.bufferWidth, 1920);
  assert.equal(ready.runtime.diagnostics.output.bufferHeight, 1080);
  assert.ok(ready.runtime.diagnostics.character.mtoonMaterialCount > 0);
  assert.ok(ready.runtime.diagnostics.character.nativeOutlineMaterialCount > 0);
  assert.ok(ready.runtime.diagnostics.character.silhouetteShellMeshCount > 0);
  assert.ok(ready.runtime.diagnostics.character.authoredSecondarySpring);
  await ready.page.evaluate(() => window.__SHORELINE__.renderFrame(0));
  await ready.page.locator("#shoreline-canvas").screenshot({
    path: `${artifactDirectory}/early-ready-frame-0000.png`,
    type: "png",
  });
  await ready.page.evaluate(() => {
    for (let frame = 0; frame <= 390; frame += 1) {
      window.__SHORELINE__.renderFrame(frame);
    }
  });
  await ready.page.locator("#shoreline-canvas").screenshot({
    path: `${artifactDirectory}/early-ready-frame-0390.png`,
    type: "png",
  });
  await ready.page.evaluate(() => window.__SHORELINE__.renderFrame(719));
  const advanced = await ready.page.evaluate(() => ({
    frame: window.__SHORELINE__.frame,
    time: window.__SHORELINE__.time,
    shot: window.__SHORELINE__.shot,
  }));
  assert.deepEqual(advanced, {
    frame: 719,
    time: 719 / 30,
    shot: "environmental-pullback",
  });
  assert.deepEqual(ready.issues, []);
  ready.scenario.advanced = advanced;
  await ready.page.close();

  const blockedPlate = await runScenario(
    "blocked-photographic-plate",
    (page) => page.route("**/assets/environment/shoreline-plate.webp", (route) => route.abort("blockedbyclient")),
    "degraded",
  );
  assert.equal(blockedPlate.runtime.systems.photographicPlate, false);
  assert.equal(blockedPlate.runtime.warnings[0].asset, "/assets/environment/shoreline-plate.webp");
  assert.match(blockedPlate.runtime.message, /capture evidence is not valid/i);
  blockedPlate.scenario.unexpectedIssues = unexpectedIssues(blockedPlate.issues, true);
  assert.deepEqual(blockedPlate.scenario.unexpectedIssues, []);
  await blockedPlate.page.close();

  const blockedVrm = await runScenario(
    "blocked-vrm",
    (page) => page.route("**/assets/character.vrm", (route) => route.abort("blockedbyclient")),
    "fatal",
  );
  assert.equal(blockedVrm.runtime.systems.validVrm, false);
  assert.equal(blockedVrm.runtime.errors[0].asset, "/assets/character.vrm");
  assert.match(blockedVrm.runtime.message, /required VRM character/i);
  blockedVrm.scenario.unexpectedIssues = unexpectedIssues(blockedVrm.issues, true);
  assert.deepEqual(blockedVrm.scenario.unexpectedIssues, []);
  await blockedVrm.page.close();

  report.passed = true;
} finally {
  await browser.close();
  await stopPreview(preview.process);
  await writeFile(`${artifactDirectory}/smoke.json`, `${JSON.stringify(report, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({ passed: report.passed, scenarios: report.scenarios.length })}\n`);
