# Iteration 02 plan gate

Routing state: `PLAN_SCORE`.

Iteration 02 starts from the public `skill-v3` tag and receives no prior
implementation source or review. It is a large design because the selected
shape owns environment rendering, character integration, animation, camera,
capture, rights, and evidence.

## Three viable shapes

| Shape | Fit | Complexity | Robustness | Locality | Evidence | Scope | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A. Calibrated photographic plate plus real 3D contact stage | 24 | 19 | 19 | 14 | 15 | 5 | **96** |
| B. Fully procedural real-time Three.js coast | 20 | 16 | 19 | 15 | 15 | 5 | **90** |
| C. Offline procedural DCC bake plus browser runtime | 25 | 15 | 16 | 12 | 14 | 3 | **85** |

Shape A is selected. Its four S3 deductions cover the plate's bounded parallax,
one horizon-calibration seam, a surfaced plate-decode failure path, and the
camera envelope's dependence on the calibration record.

Shape B is rights-safe but carries S2 risk in photographic fidelity and a small
custom art pipeline. Shape C can reach the fidelity target, but Blender bake,
export, and browser parity add unnecessary production and failure boundaries.

## Selected contract

- An original AI-generated plate supplies distant sky, horizon, sea, and rocks.
- Real Three.js geometry supplies foreground sand, water, rocks, fog, reflection,
  character contact, and parallax.
- The accepted VRM retains MToon shading and a visible outline while sharing the
  scene sun, exposure, fog, and contact-shadow direction.
- A pure 24-second timeline owns locomotion, attention, quiet idle, follow,
  close-up, pullback, focal change, and seeded bounded handheld motion.
- Deterministic capture renders frames 0-719 at `t = n / 30` in the browser and
  streams them to ffmpeg as 1920x1080 constant-frame-rate H.264.
- A separate real-time browser run measures interactive performance.

The plate remains inadmissible until its original, prompt, generation metadata,
terms receipt, disclosure, hashes, derivative command, and manual content review
are recorded.

## Budgets

- Runtime dependencies: `three`, `@pixiv/three-vrm`.
- Development dependencies: `vite`, `playwright`.
- Runtime network services: zero.
- Browser modules: lifecycle, environment, character, timeline, and styles.
- Evidence scripts: shared browser harness, smoke, and capture.
- Direct state owners: two in the browser and one in tooling.
- Observable decision branches: at most six.
- Surfaced failure paths: at most five.
- New/touched source, config, script, runtime-asset, and rights files: at most 16.
- Runtime plate: at most 8 MiB; original plus derivative: at most 35 MiB.

No second renderer, scene graph, clock, animation library, post-processing
package, runtime asset service, or fallback accepted-capture path is admitted.

## Verification

- Production build and focused timeline tests.
- Real-Chrome ready-state smoke, blocked-plate degraded state, and blocked-VRM
  fatal state with zero unexpected console/page errors.
- Deterministic anchor frames at establishing, follow, close-up, idle, and return
  beats; camera extrema must reveal no plate edge, horizon swim, or disocclusion.
- `ffprobe -count_frames` must report 1920x1080, 30/1 nominal and average rate,
  exactly 720 decoded frames, and 24 seconds.
- A warmed 1080p real-time run must sustain at least 30 effective fps with p95
  frame delta no greater than 33.4 ms and no post-warm-up stall over 100 ms.
- The manifest binds source/build identity, plate/VRM hashes, tool versions,
  WebGL identity, frame range, output hashes, and browser errors.
- Completion is rescored independently; every product category must reach 3 and
  a blind artifact review must have no open S0-S2 finding.

## Rollback

If plate rights, calibration, visual integration, capture cadence, or a mandatory
product category fails, preserve this branch and return to `skill-v3`. Do not
merge Shape B or C into the attempt.

Plan score: **96/100 — passing and not borderline**. The next gate is plate
generation, provenance, and rights acceptance.
