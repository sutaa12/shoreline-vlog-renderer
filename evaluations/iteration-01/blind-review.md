# Iteration 01 blind artifact review

## Verdict

**Rejected as the final public candidate.** The independent reviewer scored the
artifact packet **18/32 (56.25%)**. Five of eight mandatory product categories
were below 3, so the product gate failed.

The reviewer received only the product specification, product rubric, final
screenshots, capture manifest, and WebM. It did not inspect source, Git history,
plans, implementation notes, or the implementer's score.

| Category | Score | Gate | Artifact-visible observation |
| --- | ---: | --- | --- |
| Runtime correctness | 4/4 | Pass | The video decoded without blank frames or fatal interruption, and its hash matched the manifest. |
| Environment fidelity | 1/4 | Fail | The gray sky, planar water, smooth rock forms, and lightly patterned sand read as placeholder rendering rather than a photographic coast. |
| Toon/photoreal integration | 2/4 | Fail | Toon planes, a silhouette edge, and a ground shadow were visible, but the outline and character lighting did not integrate convincingly with the environment. |
| Animation and life | 2/4 | Fail | Locomotion, gaze, blink, and quiet beats existed, but posture and secondary response remained mechanical. |
| Camera authorship | 3/4 | Pass | Wide, follow, close-up, and environmental framing were readable, with tracking, zoom, and bounded wobble. |
| Capture readiness | 4/4 | Pass | The 1920x1080 WebM, contact sheet, completion frame, exact hash, and capture state were reproducible. |
| Performance | 2/4 | Fail | The reviewer decoded 719 frames with material cadence variation, including 82 intervals longer than 50 ms. |
| Originality and rights | 0/4 | Evidence blocked | Rights were not included in the deliberately isolated visual packet. This does not contradict the separately maintained repository rights ledger. |

## Severity findings

- **S1:** The environment misses the locked photographic target.
- **S1, evidence blocked:** Public-use rights were not established by the
  isolated artifact packet.
- **S2:** Character lighting, outline, and contact are not convincingly
  integrated.
- **S2:** Animation remains visibly mechanical.
- **S2:** Capture cadence is unstable.
- **S3:** The camera coverage passes, but its push/pull rhythm remains
  procedural.

## Required next changes

1. Change the environment-rendering shape to add physically varied atmosphere,
   waves and shoreline response, wet reflections, irregular rock detail, and
   coherent fog, shadow, and tone mapping.
2. Re-author character motion and integration around planted footsteps, weight
   transfer, breathing, visible secondary response, deliberate gaze, coherent
   scene lighting, and a reliable outline.
3. Produce constant-cadence 30 fps media and include authoritative rights
   receipts in the final public-candidate evidence packet.

Iteration 01 remains useful as a mechanically complete baseline, but neither its
raw implementation score nor passing automated tests override this product-gate
failure.
