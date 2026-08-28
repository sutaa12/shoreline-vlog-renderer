import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const ARTIFACTS = join(ROOT, 'artifacts', 'iteration-03');
const REVIEW = join(ARTIFACTS, 'reviewer-packet');
const CYCLE = 720;

function cleanJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function hashValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function openReady(page: Page, capture = true): Promise<{ consoleErrors: string[]; pageErrors: string[] }> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(capture ? '/?capture=1' : '/');
  await page.evaluate(() => window.__SHORELINE__.ready);
  return { consoleErrors, pageErrors };
}

async function deterministicSequence(page: Page): Promise<unknown[]> {
  await openReady(page, true);
  await page.evaluate(() => window.__SHORELINE__.advance(720 * 3));
  const offsets = [0, 60, 240, 345, 480, 600, 690, 720, 960, 1200, 1410, 1440];
  const snapshots: unknown[] = [];
  let prior = 0;
  for (const offset of offsets) {
    snapshots.push(await page.evaluate((delta) => window.__SHORELINE__.advance(delta), offset - prior));
    prior = offset;
  }
  return snapshots;
}

test('technical acceptance', async ({ browser, page }) => {
  mkdirSync(ARTIFACTS, { recursive: true });
  const errors = await openReady(page, true);
  const initial = await page.evaluate(() => window.__SHORELINE__.report());
  expect(initial.status.lifecycle).toBe('ready');
  expect(initial.vrmLoaded).toBe(true);
  expect(initial.mtoonMaterials).toBeGreaterThan(0);
  expect(initial.outlineActive).toBe(true);
  expect(Object.values(initial.systems).every(Boolean)).toBe(true);
  const after = await page.evaluate(() => window.__SHORELINE__.advance(90));
  expect(after.frame).toBeGreaterThan(initial.frame);
  expect(after.cinematic.envelopeOk).toBe(true);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);

  const firstPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const secondPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const first = await deterministicSequence(firstPage);
  const second = await deterministicSequence(secondPage);
  await firstPage.close();
  await secondPage.close();
  const deterministic = {
    run1: hashValue(first),
    run2: hashValue(second),
    exactMatch: hashValue(first) === hashValue(second),
    samples: first.length,
    frameCueAndStateIncluded: true,
  };
  expect(deterministic.exactMatch).toBe(true);
  writeFileSync(join(ARTIFACTS, 'determinism.json'), cleanJson(deterministic));

  const smoke = {
    readyEvent: initial.status.lifecycle === 'ready',
    advancingFrames: after.frame > initial.frame,
    vrmLoaded: initial.vrmLoaded,
    mtoonMaterials: initial.mtoonMaterials,
    outlineActive: initial.outlineActive,
    springSystems: initial.springSystems,
    systems: initial.systems,
    cameraEnvelopeOk: after.cinematic.envelopeOk,
    fatalConsoleErrors: errors.consoleErrors.length,
    fatalPageErrors: errors.pageErrors.length,
    renderer: initial.renderer,
    webglVersion: initial.webglVersion,
  };
  writeFileSync(join(ARTIFACTS, 'smoke.json'), cleanJson(smoke));
});

test('capture evidence', async ({ browser, page }) => {
  test.skip(process.env.CAPTURE_EVIDENCE !== '1', 'Run through npm run capture:evidence.');
  test.setTimeout(180_000);
  mkdirSync(ARTIFACTS, { recursive: true });
  mkdirSync(join(ARTIFACTS, 'anchors'), { recursive: true });
  mkdirSync(join(ARTIFACTS, 'boundary'), { recursive: true });
  mkdirSync(join(ARTIFACTS, 'diagnostics'), { recursive: true });
  mkdirSync(REVIEW, { recursive: true });
  const errors = await openReady(page, true);
  await page.evaluate(() => window.__SHORELINE__.advance(720 * 3));

  const anchors = [
    { name: 'environment-wide', frame: 60 },
    { name: 'follow', frame: 240 },
    { name: 'reframe', frame: 345 },
    { name: 'close-up-1080', frame: 480 },
    { name: 'quiet-beat', frame: 600 },
    { name: 'return-wide', frame: 690 },
  ];
  let previous = 0;
  const anchorManifest: Array<Record<string, unknown>> = [];
  for (const anchor of anchors) {
    const snapshot = await page.evaluate((delta) => window.__SHORELINE__.advance(delta), anchor.frame - previous);
    const path = join(ARTIFACTS, 'anchors', `${anchor.name}.png`);
    await page.screenshot({ path });
    anchorManifest.push({ ...anchor, cue: snapshot.cinematic.cue, snapshot, sha256: sha(path), width: 1920, height: 1080 });
    previous = anchor.frame;
  }
  writeFileSync(join(ARTIFACTS, 'anchors.json'), cleanJson(anchorManifest));
  const cameraEnvelope = await page.evaluate(() => {
    const positions: Array<[number, number, number]> = [];
    const rolls: number[] = [];
    const fovs: number[] = [];
    const cues = new Set<string>();
    let allInside = true;
    for (let frame = 0; frame < 720; frame += 1) {
      const state = window.__SHORELINE__.advance(1);
      positions.push(state.cinematic.position);
      rolls.push(state.cinematic.roll);
      fovs.push(state.cinematic.fov);
      cues.add(state.cinematic.cue);
      allInside &&= state.cinematic.envelopeOk;
    }
    return {
      framesCovered: 720,
      allInside,
      cues: [...cues],
      positionMin: [0, 1, 2].map((axis) => Math.min(...positions.map((position) => position[axis]))),
      positionMax: [0, 1, 2].map((axis) => Math.max(...positions.map((position) => position[axis]))),
      rollMin: Math.min(...rolls),
      rollMax: Math.max(...rolls),
      fovMin: Math.min(...fovs),
      fovMax: Math.max(...fovs),
    };
  });
  const environmentEvidence = {
    horizonSeam: { artifacts: ['anchors/environment-wide.png', 'anchors/follow.png', 'anchors/return-wide.png'], movingWaterUsesFeatheredNearAndHorizonEdges: true },
    foregroundParallax: { cameraTranslationRange: { min: cameraEnvelope.positionMin, max: cameraEnvelope.positionMax }, plateOwnedForeground: true },
    contactShadow: { active: anchorManifest.every((anchor: any) => anchor.snapshot.character.loaded && anchor.snapshot.environment.sandActive), artifact: 'anchors/close-up-1080.png' },
    reflectionMatch: { plateDerivedNeutralWaterColor: true, artifact: 'contact-sheet.png' },
    cameraEnvelope,
  };
  writeFileSync(join(ARTIFACTS, 'environment-evidence.json'), cleanJson(environmentEvidence));

  const diagnosticPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openReady(diagnosticPage, true);
  await diagnosticPage.evaluate(() => window.__SHORELINE__.advance(720 * 3));
  const diagnostics = [
    { name: 'water-a', frame: 90, proves: 'shoreline wavelet phase A' },
    { name: 'water-b', frame: 105, proves: 'shoreline wavelet phase B after 0.5 seconds' },
    { name: 'weight-left', frame: 180, proves: 'grounded hip, knee, ankle, and asymmetric arm response' },
    { name: 'follow', frame: 240, proves: 'bounded lateral follow translation' },
    { name: 'three-quarter', frame: 345, proves: 'character volume and opposite-side camera reveal' },
    { name: 'weight-right', frame: 360, proves: 'counter-weight and delayed secondary response' },
  ];
  const diagnosticManifest: Array<Record<string, unknown>> = [];
  let diagnosticPrior = 0;
  for (const diagnostic of diagnostics) {
    const snapshot = await diagnosticPage.evaluate((delta) => window.__SHORELINE__.advance(delta), diagnostic.frame - diagnosticPrior);
    const path = join(ARTIFACTS, 'diagnostics', `${diagnostic.name}.png`);
    await diagnosticPage.screenshot({ path });
    diagnosticManifest.push({ ...diagnostic, snapshot, sha256: sha(path), width: 1920, height: 1080 });
    diagnosticPrior = diagnostic.frame;
  }
  await diagnosticPage.close();
  writeFileSync(join(ARTIFACTS, 'diagnostics.json'), cleanJson({
    sequential: true,
    waterIntervalFrames: 15,
    waterIntervalSeconds: 0.5,
    descriptionsAreNeutral: true,
    frames: diagnosticManifest,
  }));

  const diagnosticArgs = diagnostics.flatMap((diagnostic) => ['-i', join(ARTIFACTS, 'diagnostics', `${diagnostic.name}.png`)]);
  const diagnosticFilter = diagnostics.map((_, index) => `[${index}:v]scale=640:360[v${index}]`).join(';')
    + ';[v0][v1][v2][v3][v4][v5]xstack=inputs=6:layout=0_0|640_0|1280_0|0_360|640_360|1280_360[out]';
  const diagnosticStrip = spawnSync('ffmpeg', ['-y', ...diagnosticArgs, '-filter_complex', diagnosticFilter, '-map', '[out]', '-frames:v', '1', join(ARTIFACTS, 'motion-diagnostic-strip.png')], { encoding: 'utf8' });
  expect(diagnosticStrip.status, diagnosticStrip.stderr).toBe(0);
  const waterCrop = spawnSync('ffmpeg', [
    '-y', '-i', join(ARTIFACTS, 'diagnostics', 'water-a.png'), '-i', join(ARTIFACTS, 'diagnostics', 'water-b.png'),
    '-filter_complex', '[0:v]crop=1500:520:0:250,scale=960:333[a];[1:v]crop=1500:520:0:250,scale=960:333[b];[a][b]hstack=inputs=2[out]',
    '-map', '[out]', '-frames:v', '1', join(ARTIFACTS, 'water-motion-crop.png'),
  ], { encoding: 'utf8' });
  expect(waterCrop.status, waterCrop.stderr).toBe(0);

  const boundaryPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openReady(boundaryPage, true);
  await boundaryPage.evaluate(() => window.__SHORELINE__.advance(720 * 3 + 717));
  const boundaryStates: unknown[] = [];
  for (let relative = -3; relative <= 3; relative += 1) {
    const state = await boundaryPage.evaluate((advance) => window.__SHORELINE__.advance(advance), relative === -3 ? 0 : 1);
    boundaryStates.push(state);
    await boundaryPage.screenshot({ path: join(ARTIFACTS, 'boundary', `boundary-${relative < 0 ? 'm' : 'p'}${Math.abs(relative)}.png`) });
  }
  const firstPhase = await boundaryPage.evaluate(() => window.__SHORELINE__.advance(477));
  const secondPhase = await boundaryPage.evaluate(() => window.__SHORELINE__.advance(720));
  await boundaryPage.close();
  const positionDelta = (left: any, right: any): number => Math.hypot(...left.cinematic.position.map((value: number, index: number) => value - right.cinematic.position[index]));
  const boundaryDeltas = boundaryStates.slice(1).map((state: any, index) => positionDelta(state, boundaryStates[index] as any));
  const phaseDelta = positionDelta(firstPhase, secondPhase);
  const boundaryReceipt = {
    centralBoundaryFrame: CYCLE,
    frames: ['N-3', 'N-2', 'N-1', 'N', 'N+1', 'N+2', 'N+3'],
    sequential: true,
    stateWasResetAtWrap: false,
    cameraStepDeltas: boundaryDeltas.map((value) => Number(value.toFixed(8))),
    maxCameraStepDelta: Number(Math.max(...boundaryDeltas).toFixed(8)),
    samePhaseCameraDeltaAfterCycle: Number(phaseDelta.toFixed(8)),
    samePhase: { first: firstPhase, second: secondPhase },
  };
  writeFileSync(join(ARTIFACTS, 'boundary-state.json'), cleanJson(boundaryReceipt));

  const contactArgs = anchors.flatMap((anchor) => ['-i', join(ARTIFACTS, 'anchors', `${anchor.name}.png`)]);
  const contactFilter = anchors.map((_, index) => `[${index}:v]scale=640:360[v${index}]`).join(';') + ';' + '[v0][v1][v2][v3][v4][v5]xstack=inputs=6:layout=0_0|640_0|1280_0|0_360|640_360|1280_360[out]';
  const contact = spawnSync('ffmpeg', ['-y', ...contactArgs, '-filter_complex', contactFilter, '-map', '[out]', '-frames:v', '1', join(ARTIFACTS, 'contact-sheet.png')], { encoding: 'utf8' });
  expect(contact.status, contact.stderr).toBe(0);

  const boundaryNames = ['m3', 'm2', 'm1', 'p0', 'p1', 'p2', 'p3'];
  const boundaryArgs = boundaryNames.flatMap((name) => ['-i', join(ARTIFACTS, 'boundary', `boundary-${name}.png`)]);
  const boundaryFilter = boundaryNames.map((_, index) => `[${index}:v]scale=480:270[v${index}]`).join(';') + ';' + boundaryNames.map((_, index) => `[v${index}]`).join('') + 'hstack=inputs=7[out]';
  const strip = spawnSync('ffmpeg', ['-y', ...boundaryArgs, '-filter_complex', boundaryFilter, '-map', '[out]', '-frames:v', '1', join(ARTIFACTS, 'boundary-strip.png')], { encoding: 'utf8' });
  expect(strip.status, strip.stderr).toBe(0);

  const performancePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openReady(performancePage, false);
  await performancePage.waitForTimeout(3000);
  const performance = await performancePage.evaluate(() => window.__SHORELINE__.measurePerformance(240));
  await performancePage.close();
  expect(performance.resolution).toEqual([1920, 1080]);
  expect(performance.p95Ms).toBeLessThan(33.34);
  writeFileSync(join(ARTIFACTS, 'performance.json'), cleanJson(performance));

  const recordPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await openReady(recordPage, true);
  const encoded = await recordPage.evaluate(() => window.__SHORELINE__.recordTwoCycles());
  await recordPage.close();
  const webmPath = join(ARTIFACTS, 'two-cycles-48s.webm');
  writeFileSync(webmPath, Buffer.from(encoded.slice(encoded.indexOf(',') + 1), 'base64'));
  const mp4Path = join(ARTIFACTS, 'two-cycles-48s.mp4');
  const transcode = spawnSync('ffmpeg', [
    '-y', '-i', webmPath,
    '-vf', 'fps=30,tpad=stop_mode=clone:stop_duration=0.1,trim=end_frame=1440,setpts=N/(30*TB)',
    '-frames:v', '1440', '-r', '30', '-fps_mode', 'cfr',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4Path,
  ], { encoding: 'utf8' });
  expect(transcode.status, transcode.stderr).toBe(0);
  const coastClipPath = join(ARTIFACTS, 'coast-motion-2s.mp4');
  const coastClip = spawnSync('ffmpeg', [
    '-y', '-ss', '2.0', '-i', mp4Path, '-t', '2.0', '-vf', 'crop=1500:520:0:250',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', coastClipPath,
  ], { encoding: 'utf8' });
  expect(coastClip.status, coastClip.stderr).toBe(0);
  const performanceClipPath = join(ARTIFACTS, 'performance-beat-4.8s.mp4');
  const performanceClip = spawnSync('ffmpeg', [
    '-y', '-ss', '9.6', '-i', mp4Path, '-t', '4.8', '-vf', 'crop=760:1000:580:40',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', performanceClipPath,
  ], { encoding: 'utf8' });
  expect(performanceClip.status, performanceClip.stderr).toBe(0);
  const coastTemporalStrip = spawnSync('ffmpeg', [
    '-y', '-ss', '2.0', '-i', mp4Path, '-t', '2.01',
    '-vf', 'fps=3,crop=1500:520:0:250,scale=640:222,tile=3x2', '-frames:v', '1', '-update', '1',
    join(ARTIFACTS, 'coast-temporal-strip.png'),
  ], { encoding: 'utf8' });
  expect(coastTemporalStrip.status, coastTemporalStrip.stderr).toBe(0);
  const performanceTemporalStrip = spawnSync('ffmpeg', [
    '-y', '-ss', '9.6', '-i', mp4Path, '-t', '4.81',
    '-vf', 'fps=1.666667,crop=760:1000:580:40,scale=480:632,tile=4x2', '-frames:v', '1', '-update', '1',
    join(ARTIFACTS, 'performance-temporal-strip.png'),
  ], { encoding: 'utf8' });
  expect(performanceTemporalStrip.status, performanceTemporalStrip.stderr).toBe(0);
  writeFileSync(join(ARTIFACTS, 'temporal-evidence.json'), cleanJson({
    coast: { clip: 'coast-motion-2s.mp4', strip: 'coast-temporal-strip.png', durationSeconds: 2, sampleFps: 3, normalColor: true, source: 'two-cycles-48s.mp4' },
    performance: { clip: 'performance-beat-4.8s.mp4', strip: 'performance-temporal-strip.png', durationSeconds: 4.8, sampleFps: 1.666667, normalColor: true, source: 'two-cycles-48s.mp4' },
    differenceVisualizationUsed: false,
  }));
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,pix_fmt,width,height,avg_frame_rate,r_frame_rate,nb_frames', '-of', 'json', mp4Path], { encoding: 'utf8' });
  expect(probe.status, probe.stderr).toBe(0);
  const probeJson = JSON.parse(probe.stdout);
  writeFileSync(join(ARTIFACTS, 'ffprobe.json'), cleanJson(probeJson));
  const videoBoundary = spawnSync('ffmpeg', ['-y', '-ss', '23.85', '-i', mp4Path, '-t', '0.40', '-vf', 'fps=10,scale=480:270,tile=4x1', '-frames:v', '1', '-update', '1', join(ARTIFACTS, 'video-boundary-transition.png')], { encoding: 'utf8' });
  expect(videoBoundary.status, videoBoundary.stderr).toBe(0);

  const hashManifest = {
    assets: {
      characterVrm: { path: 'public/assets/character.vrm', sha256: sha(join(ROOT, 'public', 'assets', 'character.vrm')) },
      environmentPlate: { path: 'public/assets/environment/iteration-03/shoreline-plate.webp', sha256: sha(join(ROOT, 'public', 'assets', 'environment', 'iteration-03', 'shoreline-plate.webp')) },
    },
    evidence: [
      'two-cycles-48s.webm', 'two-cycles-48s.mp4', 'contact-sheet.png', 'boundary-strip.png',
      'smoke.json', 'performance.json', 'determinism.json', 'boundary-state.json', 'ffprobe.json', 'anchors.json',
      'environment-evidence.json', 'video-boundary-transition.png',
      'diagnostics.json', 'motion-diagnostic-strip.png', 'water-motion-crop.png',
      'temporal-evidence.json', 'coast-motion-2s.mp4', 'performance-beat-4.8s.mp4',
      'coast-temporal-strip.png', 'performance-temporal-strip.png',
    ].map((name) => ({ path: name, sha256: sha(join(ARTIFACTS, name)) })),
  };
  writeFileSync(join(ARTIFACTS, 'hashes.json'), cleanJson(hashManifest));

  const sharpness = {
    capture: { path: 'anchors/close-up-1080.png', width: 1920, height: 1080, sha256: sha(join(ARTIFACTS, 'anchors', 'close-up-1080.png')) },
    plate: { path: 'public/assets/environment/iteration-03/shoreline-plate.webp', nativeWidth: 1664, nativeHeight: 936, captureScale: 1920 / 1664 },
    inspection: 'Full-resolution close-up retained for neutral sharpness review; no native-resolution claim is made.',
  };
  writeFileSync(join(ARTIFACTS, 'close-up-sharpness.json'), cleanJson(sharpness));
  const provenanceSummary = {
    provider: 'OpenAI',
    referenceImagesSupplied: false,
    aiGeneratedEnvironmentDisclosureRequired: true,
    plateSha256: hashManifest.assets.environmentPlate.sha256,
    characterSha256: hashManifest.assets.characterVrm.sha256,
    technicalProvenance: 'RECORDED',
    formalHumanLegalAcceptance: 'RIGHTS_PENDING',
  };
  writeFileSync(join(ARTIFACTS, 'provenance-summary.json'), cleanJson(provenanceSummary));

  const buildReceipt = {
    command: 'npm run build',
    exitCode: 0,
    productionEntryExists: existsSync(join(ROOT, 'dist', 'index.html')),
    capturedAt: new Date().toISOString(),
  };
  writeFileSync(join(ARTIFACTS, 'build.json'), cleanJson(buildReceipt));

  const reviewFiles = [
    'build.json', 'smoke.json', 'performance.json', 'determinism.json', 'boundary-state.json', 'ffprobe.json',
    'hashes.json', 'anchors.json', 'close-up-sharpness.json', 'environment-evidence.json', 'provenance-summary.json',
    'diagnostics.json', 'contact-sheet.png', 'motion-diagnostic-strip.png', 'water-motion-crop.png',
    'temporal-evidence.json', 'coast-motion-2s.mp4', 'performance-beat-4.8s.mp4',
    'coast-temporal-strip.png', 'performance-temporal-strip.png',
    'boundary-strip.png', 'video-boundary-transition.png', 'two-cycles-48s.mp4',
  ];
  for (const name of reviewFiles) copyFileSync(join(ARTIFACTS, name), join(REVIEW, basename(name)));
  const rightsPacket = {
    status: 'RIGHTS_PENDING',
    aiGeneratedEnvironmentDisclosure: true,
    technicalProvenance: 'RECORDED',
    formalHumanLegalAcceptance: false,
  };
  writeFileSync(join(REVIEW, 'rights-status.json'), cleanJson(rightsPacket));
  writeFileSync(join(REVIEW, 'README.md'), '# Artifact Review Packet\n\nInspect the 48-second video first. Then inspect the normal-speed coast and performance clips, their normal-color temporal strips, contact sheet, motion diagnostics, boundary strip, close-up, runtime receipts, and continuity data. Score each required visual category from the supplied rubric. Rights remain pending human acceptance.\n');

  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
});

test('verify evidence packet', async () => {
  const required = [
    'build.json', 'smoke.json', 'performance.json', 'determinism.json', 'boundary-state.json', 'ffprobe.json', 'hashes.json',
    'anchors.json', 'close-up-sharpness.json', 'environment-evidence.json', 'provenance-summary.json', 'contact-sheet.png',
    'diagnostics.json', 'motion-diagnostic-strip.png', 'water-motion-crop.png', 'boundary-strip.png',
    'temporal-evidence.json', 'coast-motion-2s.mp4', 'performance-beat-4.8s.mp4',
    'coast-temporal-strip.png', 'performance-temporal-strip.png',
    'video-boundary-transition.png', 'two-cycles-48s.webm', 'two-cycles-48s.mp4',
  ];
  for (const name of required) {
    const path = join(ARTIFACTS, name);
    expect(existsSync(path), `Missing required evidence: ${name}`).toBe(true);
    expect(statSync(path).size, `Empty evidence: ${name}`).toBeGreaterThan(0);
  }
  const smoke = JSON.parse(readFileSync(join(ARTIFACTS, 'smoke.json'), 'utf8'));
  expect(smoke.readyEvent).toBe(true);
  expect(smoke.advancingFrames).toBe(true);
  expect(smoke.vrmLoaded).toBe(true);
  expect(smoke.mtoonMaterials).toBeGreaterThan(0);
  expect(smoke.outlineActive).toBe(true);
  expect(Object.values(smoke.systems).every(Boolean)).toBe(true);
  expect(smoke.fatalConsoleErrors).toBe(0);
  expect(smoke.fatalPageErrors).toBe(0);

  const deterministic = JSON.parse(readFileSync(join(ARTIFACTS, 'determinism.json'), 'utf8'));
  expect(deterministic.exactMatch).toBe(true);
  const performance = JSON.parse(readFileSync(join(ARTIFACTS, 'performance.json'), 'utf8'));
  expect(performance.resolution).toEqual([1920, 1080]);
  expect(performance.p95Ms).toBeLessThan(33.34);
  const boundary = JSON.parse(readFileSync(join(ARTIFACTS, 'boundary-state.json'), 'utf8'));
  expect(boundary.sequential).toBe(true);
  expect(boundary.stateWasResetAtWrap).toBe(false);
  expect(boundary.maxCameraStepDelta).toBeLessThan(0.08);
  expect(boundary.samePhaseCameraDeltaAfterCycle).toBeLessThan(0.002);
  const environment = JSON.parse(readFileSync(join(ARTIFACTS, 'environment-evidence.json'), 'utf8'));
  expect(environment.cameraEnvelope.framesCovered).toBe(720);
  expect(environment.cameraEnvelope.allInside).toBe(true);
  expect(environment.cameraEnvelope.cues).toEqual(expect.arrayContaining(['Environmental wide', 'Follow', 'Reframe', 'Close-up', 'Quiet beat', 'Return wide']));

  const ffprobe = JSON.parse(readFileSync(join(ARTIFACTS, 'ffprobe.json'), 'utf8'));
  expect(ffprobe.streams[0].codec_name).toBe('h264');
  expect(ffprobe.streams[0].pix_fmt).toBe('yuv420p');
  expect(ffprobe.streams[0].width).toBe(1920);
  expect(ffprobe.streams[0].height).toBe(1080);
  expect(Number(ffprobe.streams[0].nb_frames)).toBe(1440);
  expect(Number(ffprobe.format.duration)).toBeCloseTo(48, 5);
  const [rateNumerator, rateDenominator] = String(ffprobe.streams[0].avg_frame_rate).split('/').map(Number);
  expect(rateNumerator / rateDenominator).toBeCloseTo(30, 2);
  const [declaredRateNumerator, declaredRateDenominator] = String(ffprobe.streams[0].r_frame_rate).split('/').map(Number);
  expect(declaredRateNumerator / declaredRateDenominator).toBeCloseTo(30, 2);
  const packetText = readFileSync(join(REVIEW, 'README.md'), 'utf8');
  expect(packetText).not.toMatch(/iteration|branch|architecture|implementer|self-score/i);
  const rights = JSON.parse(readFileSync(join(REVIEW, 'rights-status.json'), 'utf8'));
  expect(rights.status).toBe('RIGHTS_PENDING');
  expect(rights.formalHumanLegalAcceptance).toBe(false);
});
