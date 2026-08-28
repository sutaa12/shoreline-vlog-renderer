# Iteration 03 — Independent Blind Review, Cycle 2

## Isolation

- Status: `independent_artifact_only`
- Inspected: `docs/quality-rubric.md`, `artifacts/iteration-03/reviewer-packet/`
- Excluded: source, packages, plans, evaluations, Git history, prior reviews, and implementer scores
- Temporal review: the reviewer played the supplied 48-second MP4, 2.0-second coast clip, and 4.8-second performance clip at normal speed, then inspected the supplied strips, contact sheet, boundary evidence, and receipts.

The frozen product scope is a browser cinematic. Pivot, collision, LOD, topology, and unseen-orbit asset readiness are `OUT_OF_SCOPE` and did not affect scores.

## Scores

| Category | Score | Evidence |
| --- | ---: | --- |
| Runtime correctness | 4/4 | The 48-second 1920x1080/30fps MP4 decodes cleanly; the packet reports a ready event, advancing frames, and zero fatal console/page errors. |
| Environment fidelity | 3/4 | The coast is cohesive. Normal-speed evidence shows water motion while sky, sand, and rocks remain registered; no visible mask ghost or seam was found in supplied views. |
| Toon/photoreal integration | 2/4 | The outline, toon planes, and contact shadow are readable, but ordinary shots still show a flat, high-contrast toon figure over a photographic plate. Shirt and skin receive too little warm directional form modeling. |
| Animation and life | 2/4 | Sway, gaze change, and hair response are visible, but the full-body result remains predominantly a uniform lean. Grounded foot/hip/knee transfer and purposeful asymmetric arm/hand motion do not read strongly enough at normal speed. |
| Camera authorship | 3/4 | Wide, follow, reframe, close-up, quiet, and return-wide beats are distinct and authored. |
| Capture readiness | 4/4 | A hash-matched 48-second capture, contact sheet, anchors, and exact two-run determinism receipt are supplied. |
| Performance | 4/4 | At 1920x1080 high quality, the packet reports 16.6 ms median, 18.5 ms p95, and zero frames over 33.34 ms. |
| Originality and rights | 3/4 | Technical provenance, hashes, no supplied reference images, and AI-environment disclosure are recorded. Formal human acceptance remains `RIGHTS_PENDING`. |

## Findings

- `S2-TOON-LIGHT-INTEGRATION`: the visible toon subject remains materially and luminance-wise pasted onto the photographic coast in ordinary framing.
- `S2-PERFORMANCE-READABILITY`: at normal speed, the performance does not yet communicate a convincing full-body weight shift through root, hips, knees, arms, hands, gaze, and delayed hair.
- `S3-CLOSEUP-PLATE-SOFTNESS`: the close-up plate is visibly soft at capture scale; the packet correctly makes no native-resolution claim.

There were no S0 or S1 findings. The 24-second boundary passed: normal-speed two-cycle playback and the sequential boundary strip showed no visible discontinuity; the state receipt reports no reset, zero same-phase delta, and a small maximum camera-step delta.

## Final Allowed Cycle Changes

1. Retune MToon albedo/ramp and directional key-fill so skin, shirt, hair, and the existing contact shadow share the plate's warm key, cooler ambient, shadow direction, and contrast in both an ordinary wide and close-up.
2. Replace the near-uniform sway with one clearly readable weight-transfer phrase: planted-foot root travel, hip and knee counteraction, asymmetric forearm/hand timing, gaze anticipation, and delayed hair response; prove it in a normal-speed 4.8-second clip.

## Verdict

`REFINE_REQUIRED`

This is the final allowed refinement cycle. Technical provenance is recorded, but formal human/legal acceptance remains `RIGHTS_PENDING`.
