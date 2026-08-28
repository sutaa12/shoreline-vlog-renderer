# Iteration 02 implementation receipt

Routing state: `COMPLETION_SCORE`.

## Outcome

The selected photographic-hybrid design is implemented as one Three.js/WebGL2
scene. The accepted shoreline plate supplies the distant photographic coast;
real foreground geometry supplies shadow-catching sand, a feathered moving
water and wet-seam layer, ten irregular granite rocks, fog, contact/reflection
cues, and parallax. The accepted VRM is loaded through
`@pixiv/three-vrm`, reports 20 MToon materials, configures 20 native MToon
outlines, and adds a 13-mesh silhouette shell. Its 57 native spring joints run
alongside the authored damped secondary response.

The pure 24-second timeline owns locomotion, weight shift, breathing, gaze,
blink, quiet idle, follow, focal change, close-up, pullback, and periodic bounded
handheld translation/roll. Capture renders browser frames 0 through 719 at
`t = frame / 30` and streams Playwright canvas PNGs directly to ffmpeg.

## Budget audit

| Budget | Result | Gate |
| --- | --- | --- |
| Direct runtime dependencies | 2: `three@0.185.1` (MIT), `@pixiv/three-vrm@3.5.5` (MIT) | Pass |
| Direct development dependencies | 2: `vite@8.2.2` (MIT), `playwright@1.62.1` (Apache-2.0) | Pass |
| Installed lockfile package entries | 58 excluding the root package | Recorded |
| Runtime network services | 0 | Pass |
| Browser renderer | 1 WebGL2 `THREE.WebGLRenderer` | Pass |
| Browser state owners | 2 coherent domains: lifecycle/timeline and Three scene state | Pass |
| Tooling state owner | 1 capture/evidence run | Pass |
| Observable decision branches | 6: WebGL fatal, VRM fatal, plate degraded, ready, capture/interactive, high/balanced quality | Pass |
| Surfaced failure paths | 5: capability, plate transfer/decode, VRM transfer, VRM validation, initialization | Pass |
| Source/config/script/test/evaluation files | 14 including this receipt; generated evidence excluded | Pass (limit 16) |
| Runtime plate | 191,896 bytes | Pass (limit 8 MiB) |

There is no second renderer, animation package, post-processing package,
runtime asset service, or accepted fallback-capture path. The production bundle
is one 766 kB minified JavaScript chunk; Vite reports its advisory 500 kB chunk
warning. This is retained as S3 packaging polish because the local-only asset
load, runtime performance, and capture gates pass.

## Failure-state evidence

- Ready: WebGL2, photographic plate, real stage, VRM, MToon, outline,
  animation, and camera systems are all true.
- Blocked plate request: named `degraded` state for
  `/assets/environment/shoreline-plate.webp`; fallback may render but capture
  evidence is explicitly invalid.
- Blocked VRM request: named `fatal` state for `/assets/character.vrm`.
- The two intentionally aborted network requests emit Chrome's expected
  `ERR_BLOCKED_BY_CLIENT` resource message. Each scenario records zero
  *unexpected* console or page errors; the ready and capture runs record no
  browser issues at all.

## Verification commands

| Command | Exit/result |
| --- | --- |
| `rtk npm install` | 0; exact lockfile installed; audit reported 0 vulnerabilities |
| `rtk npm ls --depth=0` | 0; exactly 2 runtime and 2 development direct packages |
| lockfile inspection with `rtk node -e ...` | 0; lockfile v3, 58 package entries excluding root |
| `rtk npm audit` | 0; 0 vulnerabilities; no auto-fix run |
| `rtk npm test` | 0; 5/5 timeline, cadence, determinism, loop, shake/envelope, and authored-beat tests pass |
| `rtk npm run build` | 0; Vite production build succeeds with the recorded advisory chunk warning |
| `rtk npm run smoke` | 0; ready, blocked-plate degraded, and blocked-VRM fatal scenarios pass in Google Chrome |
| `rtk npm run performance` | 0; high quality at 1920×1080 passes |
| `rtk npm run capture` | 0; 720/720 browser frames, five anchors, contact sheet, video, and manifest produced |
| independent `rtk ffprobe -count_frames ...` | 0; 1920×1080, `30/1` nominal and average rate, 720 decoded frames, 24.000000 seconds |

One early test run exited 1 because the test-only recursive comparison helper
handled strings as objects; the helper was corrected and all final tests pass.
The first capture run exited 1 at frame 123 because floating-point flooring
reported `(123 / 30) * 30` as frame 122. Capture bookkeeping now preserves the
requested integer frame, and every subsequent exact capture completed with 720
frames.

## Performance evidence

The final separate real-time Chrome run used the exact final build at a
1920×1080 drawing buffer, pixel ratio 1, high quality, and a 120-frame warm-up.
Across 360 measured frames:

- mean frame delta: 16.6658 ms;
- p95 frame delta: 16.8000 ms;
- maximum frame delta: 16.8000 ms;
- effective rate: 60.003 fps;
- post-warm-up stalls over 100 ms: 0.

No quality correction was required. The balanced quality path remains a
graceful interactive fallback that lowers pixel ratio, shadow resolution, and
mesh density without removing scene systems.

## Capture evidence

- Video: `artifacts/iteration-02/shoreline-loop.mp4`
  - SHA-256 `70c492941289cbb15d756e25202a617349019afa8ba83d242a6941c4a2c68623`
- Contact sheet: `artifacts/iteration-02/contact-sheet.png`
  - SHA-256 `f64f65417ca7b7931685f363df733501a9d32f2f4d19aa22a4d3fe095a741283`
- Capture manifest: `artifacts/iteration-02/capture-manifest.json`
  - SHA-256 `9a7bd6085f311438ba6542aa97642d1d49c3e0db07acd2ebca1e7513e733a881`
- Performance report: `artifacts/iteration-02/performance.json`
  - SHA-256 `307587b8f79d16d1714ca236d22a7471d5332f16daa8d119b26ea9e3aff34af0`
- Smoke report: `artifacts/iteration-02/smoke.json`
  - SHA-256 `1949a3a55166347eca22c7ec9a1d7305a70b0807f6241e178b4c3c06cf56fbc5`
- Source identity: `03723e29e6ef1d614d3806ba6efa37d80f6d806b959233344e9d3b8170595368`
- Production build identity: `3871697ef3402acdac80b38237babd18be00e8ec417e7eab2d0c53b586f37413`
- Plate SHA-256: `f8f79c043e26da590dd2b927d5160ff3f5e72e7ceb836b699f7febb6880cc1e9`
- VRM SHA-256: `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`

Anchor frames 0, 210, 390, 480, and 690 cover establishing, follow,
close-up, quiet gaze, and return beats. Their measured luma standard deviations
range from 41.64 to 49.65 and their tonal ranges exceed 222, so none is blank.
Direct implementer inspection of the final full-resolution anchors and contact
sheet confirms the photographic surf remains visible across the shot sequence,
the toon silhouette is legible, and no plate edge or disocclusion is visible.
This direct inspection is not an independent blind review or a human audience
test.

## Bounded product-gate refactor receipts

The completion score stayed above 80 during captured revisions, but the
mandatory Environment fidelity category was 2, so the product gate required
refactoring.

### Cycle 1 — foreground integration

1. Baseline: completion score 91; the first complete sheet showed an opaque
   cyan water field, black/faceted rocks, an overlarge reflection proxy, and
   Environment fidelity 2.
2. Changes: feathered the water overlay and disabled its depth write; added
   project-generated granite color/bump maps; reduced contact/reflection
   opacity.
3. Counts: dependencies 2+2 → 2+2; renderers 1 → 1; rocks 10 → 10;
   generated rock material maps 0 → 2; reflection opacity 0.12 → 0.028–0.05.
4. Checks: tests, build, three-scenario smoke, full capture, ffprobe, and direct
   anchor inspection passed technically.
5. Result: score 91; stop reason was not reached because repeated contour-like
   rock texture kept Environment fidelity at 2.

### Cycle 2 — subtle parallax support

1. Baseline: score 91 and Environment fidelity 2.
2. Changes: replaced macro rock contours with fine mineral grain/flecks;
   reduced the largest rock scale from 2.30 to 1.32; narrowed water depth from
   20 m to 8 m and opacity from 0.38–0.58 to 0.20–0.34.
3. Counts: dependencies 2+2 → 2+2; rocks 10 → 10; water grid depth segments
   60 → 36; largest rock scale 2.30 → 1.32.
4. Checks: tests, build, smoke, performance, full capture, ffprobe, and direct
   inspection passed technically.
5. Result: score 92; wide anchors revealed the sand stage still masking the
   plate ocean, so Environment fidelity remained 2.

### Cycle 3 — calibrated sand boundary

1. Baseline: score 92 and Environment fidelity 2 in wide shots.
2. Change: shortened the real shadow-catching sand to the character/contact
   zone and let the accepted plate own distant sand and surf; the wet seam
   bridges the boundary.
3. Counts: sand depth 18.0 m → 11.8 m; far edge z −10.2 m → −4.0 m;
   sand vertices 7,663 → 5,529; sand triangles 14,976 → 10,752;
   dependencies and state owners unchanged.
4. Checks: final tests, build, three-scenario smoke, direct frame 0 and 390
   inspection, 1080p performance, 720-frame capture, contact-sheet inspection,
   manifest hashes, and independent ffprobe all pass.
5. Result: completion score 95 and every self-scored mandatory product category
   reaches at least 3. Stop reason: numeric and candidate product gates pass.

## Candidate v3 completion score

| Dimension | Score | Evidence and deduction |
| --- | ---: | --- |
| Requirement fit | 23/25 | Two S3 deductions: the real/plate sand boundary is still perceptible in wide frames; the quiet hand pose retains minor stiffness. |
| Avoidable complexity | 19/20 | One S3 deduction: the reliable outline shell duplicates the VRM scene nodes in addition to native MToon outline configuration. |
| Robustness | 19/20 | One S3 deduction: capture is deterministic for the documented sequential 0–719 run, while arbitrary out-of-order frame calls retain spring history. |
| Change locality | 15/15 | One renderer and the five planned browser modules; 14 budgeted files including this receipt. |
| Testability and evidence | 14/15 | One S3 deduction: loop closure is proven on the pure timeline, but there is no pixel-difference assertion across the encoded loop boundary. |
| Scope discipline | 5/5 | No unapproved service, asset, dependency, publication, or external mutation. |
| **Total** | **95/100** | **Pass; not borderline.** |

## Candidate product gate

| Category | Score | Basis |
| --- | ---: | --- |
| Runtime correctness | 4 | Reproducible ready loop and named degraded/fatal scenarios with zero unexpected issues. |
| Environment fidelity | 3 | Complete photographic far field with subtle real contact/parallax stage; the calibrated sand boundary remains minor polish. |
| Toon/photoreal integration | 3 | Valid MToon, native outline, silhouette shell, coherent light/shadow/contact; minor outline stylization remains. |
| Animation and life | 3 | Locomotion, weight, breath, gaze, blink, quiet beat, native springs, and authored secondary spring; hands remain slightly stiff. |
| Camera authorship | 3 | Distinct follow, close-up, gaze, establishing, and pullback beats with focal changes and bounded shake. |
| Capture readiness | 4 | Deterministic browser PNG stream, exact CFR video, nonblank anchors, contact sheet, and manifest. |
| Performance | 4 | Root reproduction of the final high-quality 1080p run is stable at measured p95 16.8 ms. |
| Originality and rights | 3 | Accepted traced assets and original code geometry; plate human legal review remains pending. |

Candidate result: `PASS` (minimum 3), subject to independent artifact-only blind
review. This score does not close the human audience, legal, publication,
Dropbox, GitHub, or Sites gates.

## Remaining gates

- `INDEPENDENT_REVIEW_PENDING`: the iteration protocol requires a fresh
  artifact-only blind review with no open S0–S2 finding.
- `HUMAN_PENDING`: no human audience test has been performed.
- `RIGHTS_PENDING`: the plate ledger accepts prototype use, but human legal
  review remains pending.
- `PUBLICATION_PENDING`: no commit, push, GitHub publication, Dropbox mutation,
  or Sites deployment was performed.

Rollback remains the public `skill-v3` tag named by the accepted ADR and plan.

## Subsequent controlling review outcome

The later independent artifact-only review scored the product 26/32 but failed
the mandatory gate: Environment fidelity and Animation and life were each 2/4,
with `ENV-01` and `ANIM-01` open at S2. The self-score above is retained as the
implementer's receipt, while the independent result controls adoption and caps
the effective completion score at 70/100. Three refactor cycles were already
exhausted, so Iteration 02 is rejected without another change cycle. See
`blind-review.md` for the controlling evidence.
