# ADR 0001: Real-time single-canvas cinematic

## Status

Accepted for iteration 01.

## Decision

Build one Vite/TypeScript application with a single Three.js WebGL canvas. The
environment, VRM character, camera timeline, and recording path share the same
renderer and fixed-step shot clock.

The implementation has four owned modules:

- `scene`: renderer, sun, sky, ocean, terrain, rocks, shadows, and quality tier;
- `character`: VRM loading, MToon preservation, outline, grounding, and motion;
- `cinematic`: fixed-step shot clock, tracking, focal length, and seeded shake;
- `app`: lifecycle, status, controls, capture, and error recovery.

The dependency budget is two runtime packages (`three` and
`@pixiv/three-vrm`) plus the minimum build, type, and browser-test tools. Example
modules shipped by Three.js are preferred to extra runtime packages.

## Options

All options were evaluated against the locked specification and asset-rights
gate. Higher complexity points mean less avoidable complexity.

| Option | Fit /25 | Complexity /20 | Robustness /20 | Locality /15 | Evidence /15 | Scope /5 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Real-time Three.js cinematic scene | 24 | 17 | 18 | 14 | 14 | 5 | **92** |
| Deterministic frame-export studio with WebCodecs and muxer | 25 | 11 | 15 | 12 | 15 | 3 | **81** |
| Photographic shoreline plate with 3D VRM composite | 22 | 18 | 17 | 13 | 13 | 5 | **88** |

The frame-export design offers stronger timestamp evidence, but adds encoder
capability detection, backpressure, muxing, and preview/export parity that this
prototype does not require. The plate design reduces GPU cost and raises
background realism, but weakens camera parallax and would require another
redistributable visual asset.

The real-time scene keeps preview and capture on one path, supports the required
camera movement directly, and has the smallest credible dependency and state
surface that still meets every locked requirement.

## Camera and rendering shape

One sun vector drives the analytic sky, PBR environment, character key light,
and shadow direction. The VRM retains its MToon materials and uses a
character-only outline. The camera composes spring-damped tracking, authored
focal-length changes, and bounded seeded translation and roll shake in that
order.

The capture mode uses the same seeded timeline as preview. It records a bounded
quality tier and reports the produced duration rather than assuming that
real-time recording was frame-perfect.

## Verification

Iteration 01 must provide these commands and artifacts:

- production build;
- browser smoke test observing ready state, advancing frames, VRM load, and no
  fatal page or console error;
- deterministic camera-bound checks at fixed timestamps;
- 20-second-or-longer capture plus frame contact sheet;
- dependency and asset-license audit;
- post-implementation simplicity score and independent visual review.

## Risks and rollback

Water reflections, device-pixel ratio, and shadow maps can exceed the capture
budget. Lower those three costs independently while retaining every required
scene element and camera beat. MToon outline upgrades are guarded by fixed-frame
screenshots. If the branch fails its gate, return to `spec-v1`; no server state,
migration, or shared runtime is changed.

