# Iteration 03 independent blind review - initial packet

Routing state: `COMPLETION_SCORE` with independent perceptual control.

## Isolation

The reviewer inspected only `docs/quality-rubric.md` and the neutral
`artifacts/iteration-03/reviewer-packet/`. It did not inspect source, Git
history or branches, package files, implementation evaluations or plans, prior
candidates, or the implementer's self-score. The 48-second MP4 was inspected
temporally rather than inferred from its contact sheet.

## Verdict

`REFINE_REQUIRED`.

The implementer's raw simplicity score of 94/100 remains recorded, but the
independent review controls adoption. Toon/photoreal integration scored 1/4 and
Animation and life scored 2/4, so two mandatory categories miss their 3/4
minimum. Under candidate skill v4, the effective completion score is capped at
70/100 until new implementation evidence receives a new independent review.

## Product scores

| Category | Score | Artifact evidence |
| --- | ---: | --- |
| Runtime correctness | 3 | Build, smoke, and deterministic receipts report ready and advancing state, zero fatal errors, loaded VRM/MToon/outline, and identical sampled runs. |
| Environment fidelity | 3 | The photographed sky, surf, sand, and rocks form a coherent coast. The 1664x936 plate is visibly softer when enlarged for the 1080p close-up. |
| Toon/photoreal integration | 1 | The outline is clean, but the bright flat shirt and evenly lit skin and hair do not share the plate's contrast, softness, or upper-left beach light. The character reads as a sharp frontal overlay and convincing foot contact is not visible. |
| Animation and life | 2 | Gaze and blink changes are present, but hips, torso, arms, hands, stance, and hair remain too nearly fixed for a believable attention and quiet cycle. |
| Camera authorship | 3 | Environmental, follow, reframe, close-up, quiet, and return beats exist. Repeated centered axial framing and restrained lateral parallax weaken the operator feel. |
| Capture readiness | 4 | The packet contains a clean 48-second two-cycle 1080p MP4, anchors, contact and boundary sheets, ffprobe evidence, and exact determinism receipts. |
| Performance | 4 | The 1080p receipt reports 16.7 ms median, 17.9 ms p95, no frame over 33.34 ms, and an estimated 59.88 fps. |
| Originality and rights | 3 technical | Asset hashes, provider record, and visible AI disclosure are present. Formal human legal acceptance remains `RIGHTS_PENDING`; this technical score does not close that gate. |

## Findings and Cycle 1 scope

- S0: 0.
- S1: 2 open.
  - `INT-03-01`: Character light, material response, and foot contact do not
    visibly belong to the photographic coast.
  - `ANIM-03-01`: The sequence reads primarily as camera motion around a
    near-static character rather than a readable full-body attention cycle.
- S2: 1 bounded relevant portion open.
  - `SCENE-03-01`: Moving water and real-time contact are not legible enough in
    the temporal artifact to prove they participate in the same moving scene.
- S3: 1 open.
  - `CAM-03-01`: Add one modest lateral follow or reveal while preserving the
    frozen translation and roll envelope.

The reviewer also requested pivot, collision, LOD, and general hidden-view
asset evidence. Those are `OUT_OF_SCOPE`: the frozen contract is a browser
cinematic and does not require a game-engine collision or LOD handoff. Cycle 1
may add bounded fixed or three-quarter visual diagnostics for character volume,
water, contact, and camera translation, but must not add those systems or score
their absence as a product failure.

## Artifact integrity

- MP4: H.264, 1920x1080, 30 fps, 1440 frames, 48.000 seconds.
- Manifest hashes checked by the reviewer matched.
- The central 24-second boundary was visually continuous.
- Boundary receipt: no state reset; maximum camera step 0.00903869.

Next gate: regenerate the complete packet after one bounded three-change cycle,
then give only the new neutral artifacts and frozen rubric to a fresh reviewer.
