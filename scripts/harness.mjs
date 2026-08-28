import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { chromium } from "playwright";

export async function startPreview(port) {
  const output = [];
  const process = spawn(
    "npm",
    ["run", "preview", "--", "--port", String(port), "--strictPort"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  process.stdout.on("data", (chunk) => output.push(chunk.toString()));
  process.stderr.on("data", (chunk) => output.push(chunk.toString()));

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Preview server exited with code ${process.exitCode}: ${output.join("")}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return { process, url, output };
    } catch {
      // The preview process is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  process.kill("SIGTERM");
  throw new Error(`Preview server did not become ready at ${url}: ${output.join("")}`);
}

export async function stopPreview(server) {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

export async function launchRealChrome() {
  return chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--hide-scrollbars"],
  });
}

export function collectPageIssues(page) {
  const issues = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push({ type: "console", text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    issues.push({ type: "pageerror", text: error.message });
  });
  return issues;
}

export async function waitForTerminalState(page) {
  await page.waitForFunction(
    () => ["ready", "degraded", "fatal"].includes(window.__SHORELINE__?.state),
    null,
    { timeout: 30_000 },
  );
  return page.evaluate(() => {
    const { renderFrame: _renderFrame, ...snapshot } = window.__SHORELINE__;
    return JSON.parse(JSON.stringify(snapshot));
  });
}

export async function sha256File(path) {
  const buffer = await readFile(path);
  return createHash("sha256").update(buffer).digest("hex");
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) paths.push(...(await filesUnder(path)));
    else if (entry.isFile()) paths.push(path);
  }
  return paths.sort();
}

export async function directoryIdentity(directory) {
  const files = await filesUnder(directory);
  const records = [];
  for (const path of files) {
    const metadata = await stat(path);
    records.push({
      path: path.slice(directory.length + 1),
      bytes: metadata.size,
      sha256: await sha256File(path),
    });
  }
  const identity = createHash("sha256");
  records.forEach((record) => {
    identity.update(record.path);
    identity.update("\0");
    identity.update(record.sha256);
    identity.update("\0");
  });
  return { sha256: identity.digest("hex"), files: records };
}

export async function filesIdentity(paths) {
  const records = [];
  for (const path of [...paths].sort()) {
    const metadata = await stat(path);
    records.push({ path, bytes: metadata.size, sha256: await sha256File(path) });
  }
  const identity = createHash("sha256");
  records.forEach((record) => {
    identity.update(record.path);
    identity.update("\0");
    identity.update(record.sha256);
    identity.update("\0");
  });
  return { sha256: identity.digest("hex"), files: records };
}
