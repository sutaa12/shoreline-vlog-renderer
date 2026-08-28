# Technical implementation receipt

## Gate state

- Routing: `COMPLETION_SCORE`.
- Technical artifact packet: regenerated after bounded Cycle 3 and ready for
  artifact-only review.
- Independent perceptual gate: the three refinement reviews returned
  `REFINE_REQUIRED`; the final Cycle 3 review returned
  `REJECT_AFTER_CYCLE_LIMIT`. The latest result controls, and effective
  completion is capped at `70/100`.
- Originality and rights: `RIGHTS_PENDING`; technical provenance and asset
  hashes are recorded, but no human legal acceptance is claimed.
- Formal adoption and redistribution: blocked by the independent and human
  rights gates above.

## Frozen contract result

The production build runs one WebGL2 Three.js renderer, one monotonic 30 fps
frame kernel, a 24-second authored phase, the recorded VRM through
`@pixiv/three-vrm`, loader-provided MToon materials, character-only outline,
moving real-time ocean, plate-owned photographic coast, transparent real
contact receiver, fog/reflection bridge, shadows, authored camera, and a
capture bridge with no independent scene state.

The complete 48-second recording continues through its central boundary
without resetting the camera, pose, secondary, ocean, or spring update. The
generated environment disclosure remains visible in capture output.

## Independent Cycle 0 baseline

The artifact-only reviewer returned `REFINE_REQUIRED`. Toon/photoreal
integration scored 1/4 and animation/life scored 2/4, so the independent gate
capped effective completion at 70/100. The controlling findings were:

- `INT-03-01` S1: plate-matched light/material response and readable foot
  contact were insufficient.
- `ANIM-03-01` S1: the body sequence read as near-static against the authored
  camera.
- `SCENE-03-01` S2, bounded portion: water and contact motion were not legible
  enough in the temporal artifact.
- `CAM-03-01` S3: lateral follow/reveal was too restrained.

The review also requested pivots, collision, and LOD. Those remain
`OUT_OF_SCOPE` for the frozen browser-cinematic contract and were not added.

## Stable counts

| Count | Result |
| --- | ---: |
| Direct runtime packages | 2 |
| Direct development packages | 3 |
| Physically installed transitive packages | 31 |
| Platform-inclusive lockfile package entries | 80 |
| External runtime services | 0 |
| Browser boundaries | 1 |
| State owners | 5 |
| Capture-owned scene state domains | 0 |
| Budgeted files | 16 |
| Surfaced failure paths | 8 |
| Observable decision outcomes | 10 |

The five state owners remain `AppStatus`, `FrameKernel`, `EnvironmentSystem`,
`CharacterSystem`, and `CinematicSystem`. `CaptureBridge` only commands the
kernel and reads evidence state.

## Pre-capture correctness pass

This pass occurred before the first complete capture and is not a visual
refinement cycle.

1. Replaced the bounded plate sampling that exposed a stretched lower edge
   with an edge-free projected plate plus an oversized 8%-opacity contact
   receiver. Visible projection/contact edges changed from 1 to 0.
2. Moved the two real-time proxy rocks outside the authored view so the
   photographic plate owns every visible rock. Visible synthetic rocks changed
   from 5 to 0; required visible plate rocks remain present.
3. Restored the humanoid hips rest translation and rotated upper/lower arms
   into a relaxed, phase-driven pose. Overwritten humanoid rest translations
   changed from 2 axes to 0; body, gaze, arm, expression, and spring updates
   remain sequential.

Checks: the production build and browser acceptance passed; full-resolution
`wide-v4`, `close-v4`, and `quiet-v4` anchors showed no geometry edge, texture
stretch, visible proxy rock, or T pose. Stop reason: the corrected anchors were
safe to capture.

## Complete evidence

| Check | Result |
| --- | --- |
| `npm ci` | Exit 0; 37 packages installed by npm, 0 vulnerabilities |
| `npm run build` | Exit 0; production bundle emitted |
| `npm run verify:rights` | Exit 0 with explicit `RIGHTS_PENDING`, asset hashes match |
| `npm run test:acceptance` | Exit 0; ready, advancing frame, VRM, 20 MToon material uses, outline, WebGL2, and all required systems observed; 0 fatal console/page errors |
| Determinism | Two runs have identical frame/cue/state SHA-256 `90af63c595cefb79905935fa20ffb2cf745576bbb77ce6d590197308b60f0e20` |
| Sequential boundary | No reset; maximum adjacent camera step 0.00903869; consecutive-cycle same-phase camera delta 0 |
| Encoded transition | Actual 23.85-24.25 second MP4 frames show no visible boundary snap |
| Performance | 1920x1080 high tier; median 16.8 ms, p95 19.6 ms, 0 frames above 33.34 ms after warm-up |
| Video | H.264, 1920x1080, 48.000 seconds, constant 30 fps |
| Plate sharpness | Exact 1920x1080 close-up retained; plate native size truthfully recorded as 1664x936 |
| Motion diagnostics | Six sequential 1080p frames plus a neutral strip and enlarged 0.5-second shoreline comparison cover contact, weight transfer, camera translation, character volume, and water phase |
| Normal-speed temporal evidence | Exact-MP4-derived 2.0-second coast and 4.8-second performance clips plus normal-color temporal strips; no difference visualization |

Evidence is under `artifacts/iteration-03/`. The neutral reviewer packet contains
no code, branch label, selected architecture label, self-score, or design
discussion.

## Post-review capture normalization

A final clean rerun exposed a transport defect that the earlier verifier did
not reject: one MediaRecorder run produced 1,439 frames and 47.966667 seconds
while still exiting 0. This was a technical capture-path correction, not a
fourth visual refinement cycle. No environment, character, animation, camera,
lighting, or material behavior changed.

The capture bridge now uses a zero-rate canvas stream and explicitly requests
each rendered frame. The FFmpeg normalization pads only a missing terminal
frame, trims to 1,440 frames, resets timestamps to CFR 30, and the verifier now
requires H.264, yuv420p, 1920x1080, both declared and average 30 fps, exactly
1,440 frames, and 48.000 seconds. Two real browser captures after the change
each met those exact container checks. GPU and browser encoding bytes remain
non-contractual; the deterministic state hash remains the reproducibility
control.

The independently reviewed, Dropbox-synchronized MP4 remains the canonical
artifact and was restored after the transport test: SHA-256
`cfebea638ea91af0b40b981d2937ada08a8828f5bd7db778608cb445761932c4`,
22,650,914 bytes, 1,440 frames, and 48.000 seconds. Its MP4-derived clips,
strips, probe, and hash manifest were regenerated from that canonical file.
The capture correction cannot overturn the existing visual rejection, and no
new acceptance review is claimed.

## Completion score

`94/100` using the fixed candidate-skill deductions:

| Dimension | Score | Deduction and evidence |
| --- | ---: | --- |
| Requirement fit | 24/25 | `-1 S3`: the 1664x936 plate is below native 1920x1080; exact close-up evidence preserves this bounded sharpness risk. |
| Avoidable complexity | 19/20 | `-1 S3`: deterministic image/video assembly and verification share one comparatively large acceptance file to preserve the fixed 16-file budget. |
| Robustness | 19/20 | `-1 S3`: the browser-native source transport remains MediaRecorder/WebM; the normalized upload MP4, exact 30 fps probe, state hashes, and encoded-boundary artifacts cover its portability risk. |
| Change locality | 15/15 | No deduction; runtime responsibilities remain inside the seven selected source owners. |
| Testability and evidence | 12/15 | `-3 S2`: the exact dependency budget omits `@types/three`, so the build checks project-owned TypeScript but treats the current Three.js import surface as implicit module types. Runtime, browser, hash, frame-state, and image/video evidence cover the resulting integration risk. |
| Scope discipline | 5/5 | No deduction; direct packages, state owners, files, services, and browser boundaries remain within budget. |

The raw implementation score remains `94/100`. The independent
`REFINE_REQUIRED` result still controls and caps effective completion at
`70/100`; this score does not close either the fresh-review or human rights
gate.

## Provisional perceptual self-scores

These scores only decide whether to spend the authorized implementer refinement
cycle. They cannot certify the product gate.

| Category | Provisional score | Evidence note |
| --- | ---: | --- |
| Runtime correctness | 4/4 | Reproducible build, smoke, state hashes, and uninterrupted capture |
| Environment fidelity | 3/4 | Stable open-surf mask drives small plate UV motion and irregular glints over the existing 3D ocean while excluding sky, sand, and right-side rocks; independent temporal judgment pending |
| Toon/photoreal integration | 3/4 | Loader MToon albedo/ramp, smoother warm key and cooler fill, clean outline, and paired moving soft contacts are readable in ordinary wide and close views; independent judgment pending |
| Animation and life | 3/4 | One planted-foot transfer now replaces the uniform primary sway: gaze anticipates, root/hip travel, knee/ankle release, torso counteraction, asymmetric hands, delayed hair, and quiet recovery read in the normal-speed clip; independent judgment pending |
| Camera authorship | 3/4 | Six cues now span x -1.20852 through 1.083675 with bounded roll, follow, opposite-side reveal, close-up, and return |
| Capture readiness | 4/4 | Exact 1,440-frame two-cycle MP4, contact sheet, normal-speed clips, temporal strips, encoded and rendered boundary strips, and manifests |
| Performance | 4/4 | High-tier 1080p p95 19.6 ms with no long frames in the measured window |
| Originality and rights | `PENDING` | Human legal acceptance is absent; no numeric pass is assigned |

## Post-independent refinement Cycle 1

- Baseline: raw simplicity `94/100`; controlling independent cap `70/100`;
  two S1 findings plus the bounded S2 and S3 findings above.
- Change group 1, toon/plate integration: recalibrated all 20 loader-provided
  MToon material uses and the existing upper-left soft light, then added two
  paired radial, plate-brown foot-contact cues. Explicit paired cues changed
  from 0 to 2; MToon uses stayed 20 and material ownership stayed in
  `CharacterSystem`.
- Change group 2, animation/life: extended the existing periodic sequence with
  six keyed lower-body bones (two upper legs, two lower legs, two feet), two
  keyed hands, stronger hip transfer/torso counter-response, directed gaze,
  quiet breath, and delayed hair response. Explicit lower-body keyed bones
  changed from 0 to 6 and keyed hands from 0 to 2; the single monotonic kernel
  and single spring update remained sequential through wrap.
- Change group 3, scene/camera evidence: added one phase-periodic broken
  shoreline-wavelet cue over the existing real 3D ocean, expanded the bounded
  follow/reveal to x -1.20852 through 1.083675, and added six neutral diagnostic
  frames, one motion strip, and one enlarged water comparison. Shoreline cue
  layers changed from 0 to 1 and diagnostic frames from 0 to 6.
- Structural before/after counts: unchanged at 5 direct packages, 5 state
  owners, 16 budgeted files, 10 observable decision outcomes, and 8 surfaced
  failure paths. No dependency, browser boundary, runtime service, or capture
  scene-state owner was added.
- Checks: `npm ci`, build, rights-pending verification, technical acceptance,
  full 48-second capture, and evidence verification all completed with their
  required outcomes. Full-resolution anchors, contact sheet, motion diagnostic,
  enlarged water comparison, rendered boundary strip, actual encoded boundary,
  same-phase states, and performance receipt were inspected.
- New raw score: unchanged at `94/100` under the fixed deductions above.
  Provisional perceptual self-scores are at least 3/4, but the independent cap
  remains controlling until a fresh review.
- Post-independent bounded cycles consumed: **1**.
- Stop reason: all three authorized groups are evidenced, no fourth change
  group or out-of-scope game-asset system was added, and the complete neutral
  packet is ready for source-blind re-review.

## Independent Cycle 1 review baseline

The fresh artifact-only reviewer again returned `REFINE_REQUIRED`.
Environment fidelity scored 2/4, toon/photoreal integration scored 1/4, and
animation/life scored 2/4. Runtime correctness scored 4/4, camera authorship
3/4, capture readiness 4/4, performance 4/4, and technical rights 3/4 with
formal rights still `RIGHTS_PENDING`. The effective completion cap therefore
remained 70/100 and controlled Cycle 2.

## Post-independent refinement Cycle 2

- Baseline: raw simplicity `94/100`; controlling independent cap `70/100`;
  environment 2/4, integration 1/4, and animation 2/4.
- Change group 1, material/light/contact: corrected the calibration to use the
  loader MToon `color` property across all 20 material uses, applied a darker
  warm shade factor, reduced GI/rim and ambient contribution, and moved the
  warm directional source farther upper-left. Ambient intensity changed from
  0.72 to 0.28 and directional intensity from 3.15 to 4.65. The two existing
  contact cues remained plate-brown and feathered, grew from 0.19 by 0.095 to
  0.235 by 0.115, and now follow the authored root/weight phase.
- Change group 2, normal-playback performance: increased primary weight
  amplitude from 0.105 to 0.17 and root travel coefficient from 0.34 to 0.58,
  strengthened torso counter-rotation and asymmetric left-hand intent, and
  added one periodic grounded step pulse plus longer directed-gaze and quiet
  settle beats. The six keyed lower-body bones, two hands, one spring system,
  one monotonic kernel, and 24-second owner remained unchanged; no state reset
  was introduced.
- Change group 3, live coast: replaced reliance on numeric phase evidence with
  one tightly feathered open-surf mask on the existing photographic plate.
  The mask applies small periodic UV drift and two irregular moving glint bands
  while excluding sky, sand, non-water midground, and right-side rocks. Masked
  plate-displacement regions changed from 0 to 1. Normal-speed reviewer clips
  changed from 0 to 2 and MP4-derived normal-color temporal strips from 0 to 2.
- Structural before/after counts: unchanged at 5 direct packages, 5 state
  owners, 16 budgeted files, 10 observable decision outcomes, and 8 surfaced
  failure paths. No dependency, source owner, file, service, browser boundary,
  pivot, collision, LOD, or other engine-only system was added.
- Checks: the complete six-command path passed after the final mask and exact
  frame-bound changes. The upload MP4 is H.264, 1920x1080, exactly 48.000
  seconds and 1,440 frames at constant 30 fps. Determinism hashes match at
  `a101a66a91dd92f506b50e3ae3bf65ced83c18a4cfddbe467f5fba3281ee4e7f`.
  The central boundary is sequential with no reset, maximum camera step
  0.00903869, and same-phase delta 0. High-tier 1080p performance measured
  16.6 ms median, 18.5 ms p95, and no frame above 33.34 ms.
- Inspection: the final full-resolution close-up and contact sheet show the
  warm directional model and moving soft contacts; the tightened close frame
  has no prior right-rock smudges. The exact-MP4 coast/performance clips and
  normal-color strips, rendered boundary strip, encoded boundary transition,
  and same-phase state snapshots were inspected.
- New raw score: provisionally unchanged at `94/100` under the fixed
  deductions above. This does not supersede the latest independent result.
- Post-independent bounded cycles consumed: **2**.
- Stop reason: all three authorized Cycle 2 groups are represented in the
  exact final video and neutral packet, technical evidence is complete, and
  the next valid action is a fresh source-blind review.

## Independent Cycle 2 review baseline

The fresh artifact-only reviewer again returned `REFINE_REQUIRED`.
Environment fidelity scored 3/4, toon/photoreal integration scored 2/4, and
animation/life scored 2/4. Runtime correctness scored 4/4, camera authorship
3/4, capture readiness 4/4, performance 4/4, and technical rights 3/4 with
formal rights still `RIGHTS_PENDING`. The two S2 findings on material/light
integration and performance readability kept the effective completion cap at
70/100 and controlled the final authorized cycle.

## Post-independent refinement Cycle 3

- Baseline: raw simplicity `94/100`; controlling independent cap `70/100`;
  toon/photoreal integration 2/4 and animation/life 2/4. The environment,
  camera, capture, plate, dependency graph, and runtime architecture were
  frozen.
- Change group 1, material/light/contact: retuned all 20 loader-provided MToon
  material uses from base-color scalar 0.78 to 0.74, shade multiplier
  `(0.46, 0.34, 0.26)` to `(0.58, 0.48, 0.42)`, shading shift -0.36 to -0.28,
  toony factor 0.28 to 0.18, GI equalization 0.08 to 0.16, and rim mix 0.14 to
  0.08. The existing upper-left key changed from `0xffdfb4` at 4.65 to
  `0xffd5a8` at 4.10, key-shadow intensity from 0.62 to 0.54, and ambient from
  `0x9da7a4` at 0.28 to cooler `0x8b9ca6` at 0.40. The two existing contact
  cues remained paired, feathered, plate-brown, and character-following;
  opacity changed from 0.34 to 0.30 and nominal size from 0.235 by 0.115 to
  0.255 by 0.128 so contact remains legible without a hard sticker edge.
- Change group 2, planted-foot phrase: removed both full-cycle primary lateral
  oscillators and replaced them with one eased phrase from gaze anticipation
  through a 0.165-unit root/hip transfer, planted-leg knee/ankle counteraction,
  opposite-foot release, asymmetric forearm/hand timing, delayed head/hair
  response, and quiet recovery. Full-cycle primary sway oscillators changed
  from 2 to 0 and localized planted-foot phrases from 0 to 1. The single
  second-order secondary state, spring update, monotonic frame kernel, and
  24-second owner remained sequential and were not reset at wrap.
- Structural before/after counts: unchanged at 5 direct packages, 5 state
  owners, 16 budgeted files, 10 observable decision outcomes, and 8 surfaced
  failure paths. No dependency, file, service, state owner, browser boundary,
  plate change, or engine-only system was added.
- Checks: the complete six-command path passed. `npm ci` installed 37 packages
  with 0 vulnerabilities; build, technical acceptance, full capture, and
  evidence verification exited 0; rights verification exited 0 while explicitly
  reporting `RIGHTS_PENDING` and matching both recorded asset hashes. The
  regenerated H.264 MP4 is 1920x1080, exactly 48.000 seconds and 1,440 frames
  at constant 30 fps, with SHA-256
  `cfebea638ea91af0b40b981d2937ada08a8828f5bd7db778608cb445761932c4`.
  The exact-video 4.8-second normal-speed proof has SHA-256
  `bb4fcb239a243dac7d5b09ec36f6ec28f9e09a4f72c323a89a0cc399df52207c`.
- Continuity and performance: two deterministic runs matched exactly at
  `90af63c595cefb79905935fa20ffb2cf745576bbb77ce6d590197308b60f0e20`.
  The central wrap remained sequential with no reset, maximum adjacent camera
  step 0.00903869, and same-phase camera delta 0. High-tier 1080p performance
  measured 16.8 ms median, 19.6 ms p95, and no frame above 33.34 ms after
  warm-up.
- Inspection: the full-resolution wide/close anchors and contact sheet show the
  warmer directional material model, cooler fill, clean outline, and readable
  soft moving contact. The exact-MP4 4.8-second clip and normal-color strip show
  the anticipated planted-foot transfer, opposite knee/ankle release,
  asymmetric arms, gaze turn, delayed hair, and return. The rendered boundary
  strip, encoded 23.85-24.25-second transition, and same-phase state snapshots
  show no wrap snap.
- New raw score: provisionally unchanged at `94/100` under the fixed
  deductions above. This implementer score does not supersede the latest
  independent result.
- Post-independent bounded cycles consumed: **3 of 3**.
- Stop reason: the final allowed cycle is consumed, both authorized changes are
  represented in the exact final video and neutral packet, and no further
  implementer refinement is permitted. The next valid action is a fresh
  source-blind review.

## Independent Cycle 3 final review

The final artifact-only reviewer returned `REJECT_AFTER_CYCLE_LIMIT`. Runtime
correctness scored 4/4, environment fidelity 3/4, camera authorship 3/4,
capture readiness 4/4, and performance 4/4. Toon/photoreal integration and
animation/life each remained 2/4, leaving two open S2 findings. Technical
provenance was present, while formal rights remained `RIGHTS_PENDING`.

The reviewer independently passed the actual 24-second encoded boundary and
confirmed the supplied MP4 evidence hashes. The reviewer also recorded one S3
packet-integrity limitation: `hashes.json` names a WebM digest whose WebM file
is not included in the neutral packet. The hash-verified final MP4 remains
present.

The raw implementer simplicity score remains 94/100. The independent
perceptual gate controls and caps the effective completion score at 70/100.
No adoption pass is claimed.

## Next gate

Preserve this branch, video, evidence packet, and final rejection as the
strongest technical candidate. The three authorized post-independent cycles
are exhausted; no extra implementer cycle is available under the frozen
workflow. A future attempt must begin with a materially different large-design
selection and representative perceptual feasibility spike. Formal adoption
also still requires human acceptance of the generated-plate rights record.
