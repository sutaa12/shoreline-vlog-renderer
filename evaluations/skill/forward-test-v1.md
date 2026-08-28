# Candidate skill v1 forward test

## Test design

An isolated reviewer received only candidate skill v1 and three synthetic
requests. It had no repository history and made no edits.

1. A one-message CLI copy correction tested false-positive routing.
2. A 10,000-model offline catalog with an overbuilt distributed proposal tested
   large-plan selection and removal of avoidable infrastructure.
3. A completed photo organizer with a destructive trash boundary and extensive
   indirection tested evidence requirements and the score-triggered refactor
   loop.

## Observed behavior

- The small copy request correctly avoided scoring and three-option ceremony.
- The catalog request produced three viable designs, selected a direct static
  catalog and loopback server at 92/100, and rejected the distributed services
  because they covered no locked requirement.
- The photo organizer received a provisional 31/100 and a bounded replacement
  plan, but the response exposed pressure to assign an exact completion score
  without current implementation artifacts.
- The first real project attempt also showed that a raw architecture score can
  exceed 80 while a missing locked visual requirement correctly caps the
  effective result and requires rejection.

## Findings

### Major

1. V1 did not define an `EVIDENCE_BLOCKED` state, so artifactless completion
   reviews could appear more precise than the evidence allowed.
2. V1 required exactly three options without defining what to do when fewer than
   three viable non-strawman choices existed or when a completed implementation
   needed only local correction.

### Moderate

1. S0-S3 and partial-credit anchors were undefined, reducing score
   reproducibility.
2. Large-work triggers were broad enough to burden a bounded change that merely
   followed an existing build or deployment shape.
3. Refactor cycles did not require measurable before/after reductions or a
   structured stop receipt.

## V2 decisions

- Add explicit `OUT_OF_SCOPE`, `PLAN_SCORE`, `COMPLETION_SCORE`,
  `EVIDENCE_BLOCKED`, and `DESIGN_BLOCKED` states.
- Limit exactly-three-option comparison to initial large-plan selection and
  implementation-shape replacement; never fabricate a third option.
- Define S0-S3 plus full, partial, and low score bands for all six dimensions.
- Refine the large-work trigger to consequential architecture choices rather
  than any isolated build or deployment edit.
- Require each refactor cycle to record its evidence baseline, no more than
  three changes, measurable before/after surface, checks, new score, and stop
  reason.

These changes are evidence-supported. V2 remains project-local until it passes
another isolated forward test and the remaining real implementation attempts.
