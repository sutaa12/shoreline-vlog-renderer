# Iteration 02 independent blind review

Routing state: `COMPLETION_SCORE` with independent product-gate control.

## Verdict

**Product score: 26/32 (81.25%).**

**Mandatory gate: `FAIL`.** Environment fidelity and Animation and life are
both below 3/4, with two open S2 findings. Iteration 02 is preserved as a
rejected comparison candidate and is not the final technical public candidate.

The implementer's 95/100 simplicity/completion score remains part of the
evidence record. It does not override the independent artifact review: missing
two locked visual requirements caps the effective adoption score at 70/100
until a new implementation supplies new evidence. The three authorized
refactor cycles are already exhausted, so this branch receives no fourth fix
cycle.

## Artifact-only score

| Category | Score | Artifact evidence |
| --- | ---: | --- |
| Runtime correctness | 4 | The smoke packet passes: ready state advances from frame 0 to 719; a missing plate degrades correctly; a missing VRM fails clearly; no unexpected issue is recorded. |
| Environment fidelity | 2 | The photographic sky and sea plate is convincing, but the repeating flat sand, dark low-poly/intersecting rocks, and straight translucent wet seam visibly detach the real 3D stage from it. This meets the rubric anchor for several synthetic or disconnected elements. |
| Toon/photoreal integration | 3 | Clean toon planes and outline remain legible, with directional cast and foot-contact shadows. Flat bright character lighting and a hard, dark shadow remain weaker than the soft photographic daylight. |
| Animation and life | 2 | Walking, turning, gaze, a quiet pause, and hair response all exist, but the rigid torso and arms plus persistent splayed-hand pose read mechanically. Settled hair at frame 719 snaps to strongly wind-blown hair at frame 0, so the encoded loop is not visually continuous. |
| Camera authorship | 3 | Environmental establishing and pullback, follow framing, push/zoom, close-up, and a quiet profile beat are visible. Movement is strongly eased and center-biased; bounded handheld character is too subtle to read consistently as an operator. |
| Capture readiness | 4 | Hashes match the manifest. The MP4 is exactly 1920x1080, 24.000 seconds, 720 frames, H.264/yuv420p CFR at 30 fps. Frame timestamps remain monotonic at 0.033333-0.033334 seconds with zero off-nominal deltas; freeze analysis found no span of at least 0.25 seconds. |
| Performance | 4 | The measured high-quality 1080p run reports 60.003 effective fps, 16.8 ms p95 and maximum frame delta, and zero post-warm-up stalls over 100 ms. |
| Originality and rights | 4 technical | VRM origin, source commit, embedded permissions, and digest are recorded. The no-reference AI plate preserves its prompt, original and runtime digests, terms receipt, publisher, and disclosure. This is technical provenance only. |

## Findings

- S0 critical: 0.
- S1 major: 0.
- S2 moderate: 2 open.
  - `ENV-01`: The procedural contact stage does not form one convincing
    photoreal coast with the plate.
  - `ANIM-01`: Motion remains visibly mechanical, and the encoded 719-to-0
    transition has a conspicuous hair-state snap. Pure-timeline equality does
    not prove continuity of secondary-motion state.
- S3 minor: 2 open.
  - `INT-01`: Character illumination and cast-shadow softness do not fully
    match the photographic daylight.
  - `CAM-01`: All camera beats exist, but handheld presence and operator-like
    reframing are under-articulated.

## Top three changes for a new implementation

1. Rebuild the foreground match: remove the horizontal wet seam, add irregular
   wet/dry sand breakup and reflections, improve rock geometry and material
   variation, eliminate intersections and black facets, and match the plate's
   exposure, haze, and shadow softness.
2. Re-author motion with hip and torso weight transfer, arm swing, clean foot
   contacts, relaxed hands, idle breathing, and subtler gaze transitions.
   Deterministically warm or reset secondary motion and verify repeated
   719-to-0 playback.
3. Match the character key/fill and shadow softness to the plate, then add
   restrained operator-like translation and roll with less center-locked
   framing while retaining the shot sequence.

## External gates

- `HUMAN_PENDING`: no human audience test is evidenced.
- `RIGHTS_PENDING`: human legal acceptance of the AI-generated shoreline plate
  remains pending; the terms receipt is not legal approval.
- Deployment and publication were outside this artifact-only review.

Reviewer isolation: the reviewer received only the rendered artifacts, capture
and smoke/performance packets, the rights packet, and the scoring rubric. It did
not receive implementation source, branch history, prior iteration materials,
or the implementer's self-score.
