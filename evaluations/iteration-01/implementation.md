# Iteration 01 implementation gate

## Outcome

The real-time single-canvas design is implemented and technically reproducible,
but this iteration does not pass the locked visual requirement. The final
browser artifact retains a visibly procedural, low-detail environment instead
of a convincingly photoreal shoreline. This is an S2 product-quality finding,
so the iteration remains unaccepted even though build, runtime, animation,
camera, and capture checks pass.

## Implemented contract

- `scene` owns the WebGL2 renderer, analytic sky, planar ocean reflection,
  procedural sand and rock geometry, shared sun, fog, environment reflection,
  shadows, outline pass, and quality tiers.
- `character` loads `/assets/character.vrm` through `VRMLoaderPlugin`, verifies
  skinned MToon content, keeps native MToon outlines, grounds the model, applies
  a looping humanoid pose, drives gaze and expressions, and updates spring
  bones.
- `cinematic` owns a 30 fps fixed-step, 24-second loop with five authored shot
  beats, focal-length changes, subject-relative framing, and seeded bounded
  translation and roll.
- `app` owns loading/ready/degraded/fatal status, diagnostics, the animation
  loop, quality selection, and same-path `canvas.captureStream` recording.

The contact sheet demonstrates the environmental, follow, medium, close-up,
profile, and pullback compositions. It does not establish photoreal quality.

## Changed files

Runtime and configuration:

- `index.html`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `playwright.config.ts`
- `src/app.ts`
- `src/character.ts`
- `src/cinematic.ts`
- `src/scene.ts`

Verification, capture, and handoff:

- `tests/cinematic.spec.ts`
- `tests/smoke.spec.ts`
- `scripts/capture.mjs`
- `README.md`
- `artifacts/iteration-01/capture-manifest.json`
- `artifacts/iteration-01/contact-sheet.png`
- `artifacts/iteration-01/capture-complete.png`
- `artifacts/iteration-01/runtime-preview-final.png`
- `artifacts/iteration-01/shoreline-cinematic.webm`
- `evaluations/iteration-01/implementation.md`

No protected specification, skill, VRM, rights-ledger, gate-manifest, branch,
tag, remote, Dropbox, Sites, or GitHub setting was modified. No commit or push
was made.

## Dependency audit

Direct runtime dependencies: **2** (`three`, `@pixiv/three-vrm`). Direct
development dependencies: **4** (`vite`, `typescript`, `@types/three`,
`@playwright/test`). The implementation stayed within both budgets and uses
Three.js example modules for post-processing and reflective water.

After `npm install`, `git status --short` showed only the new implementation
files and lockfile. Inspection of the lockfile root confirmed the same two
runtime and four development dependencies. `npm audit --json` reported zero
info, low, moderate, high, or critical vulnerabilities; no audit fix was run.

## Verification receipts

| Command | Exit | Errors / failures | Evidence |
| --- | ---: | ---: | --- |
| `npm install` | 0 | 0 audit vulnerabilities | 42 packages added; root lockfile scope inspected |
| `npm run build` | 0 | 0 errors | Vite transformed 24 modules; emitted 797.63 kB JS (201.72 kB gzip) |
| `npm test` | 0 | 0 failures | 4 deterministic camera tests and 1 real-Chrome runtime smoke test passed |
| `npm run capture` | 0 | 0 runtime, console, or page errors | 720 fixed frames; 24.0154 s wall duration; 1920×1080 VP9 WebM |
| `npm audit --json` | 0 | 0 vulnerabilities | Production and development graph audited separately from acceptance |

The build emits one non-fatal chunk-size warning because Three.js, the VRM
runtime, and the character loader share the single entry chunk. Code splitting
was not added because it would not improve startup correctness or the failed
visual gate in this iteration.

Capture artifacts:

- `artifacts/iteration-01/shoreline-cinematic.webm` — 21,679,502 bytes, SHA-256
  `8a2a7d952e3aaed0dadd84ced0e7247604252b5fde2db6ae3917065e350b2709`
- `artifacts/iteration-01/contact-sheet.png`
- `artifacts/iteration-01/capture-complete.png`
- `artifacts/iteration-01/runtime-preview-final.png`
- `artifacts/iteration-01/capture-manifest.json` — binds runtime diagnostics,
  checksums, frame count, wall time, packet timeline, viewport, and error arrays

Chrome's MediaRecorder WebM does not reliably populate container duration or
average-frame-rate metadata. The manifest therefore records 720 authored fixed
frames, the 24.0154-second recording wall time, and the final observed packet
timeline in addition to the file digest.

## Refactor cycles

Three bounded visual remediation cycles were applied inside the owned runtime:

1. corrected exposure, shoreline masking, water scale, and the character's
   near-T-pose baseline;
2. added a procedural atmospheric sky, seamless sand detail, longer ocean
   coverage, and refined rock geometry;
3. added a bounded planar reflection path, cloud definition, and smoothed rock
   normals.

The third cycle improved coherence and removed the most obvious pose and
horizon defects, but the final contact sheet still looks synthetic. A fourth
local cleanup would exceed the skill's three-cycle limit and would not address
the underlying art-direction/material-detail gap.

## Post-implementation simplicity score

This uses the exact six-dimension rubric from
`skills/simple-robust-implementation/SKILL.md` and scores the completed files
and artifacts rather than the plan.

| Dimension | Score | Observation |
| --- | ---: | --- |
| Requirement fit | 16/25 | Every functional system and evidence path exists, but the locked photoreal-coherent environment target is not met. |
| Avoidable complexity | 16/20 | Four runtime owners and two dependencies remain compact; reflection and capture introduce necessary GPU/browser paths. |
| Robustness | 17/20 | Capability, asset, status, capture, timing, and error paths are bounded and observed without fatal errors; MediaRecorder metadata remains browser-dependent. |
| Change locality | 14/15 | Scene, character, cinematic time, and lifecycle each have one owner and narrow interfaces. |
| Testability and evidence | 14/15 | Deterministic bounds, real-browser state, video, packet timeline, checksum, and contact sheet bind claims to the current build; visual quality still requires judgment. |
| Scope discipline | 5/5 | No editor, server, muxer, physics layer, unrelated asset, or speculative compatibility path was added. |
| Raw total | **82/100** | The implementation shape is compact and technically evidenced. |
| Effective total | **70/100 — not passing** | A missing locked requirement caps the score at 70 under the skill contract. |

## Product gate and next gate

The product rubric is technically passing in runtime correctness, toon/scene
integration, animation, camera authorship, capture readiness, performance, and
rights traceability. Environment fidelity is **2/4**: all required elements are
present, but several remain visibly synthetic and the result lacks the
photoreal lighting/material depth required for a score of 3. Because every
mandatory category must reach 3, iteration 01 is not an accepted candidate.

Known limitations are the flat atmospheric range, simplified sand and rock
microdetail, visibly procedural ocean reflection, limited source-character
surface detail, and the single-chunk build warning. A new iteration should
change the environment-rendering shape rather than continue local shader
tuning. Independent visual review is the next gate; human audience testing,
publication, and deployment remain separate and pending.
