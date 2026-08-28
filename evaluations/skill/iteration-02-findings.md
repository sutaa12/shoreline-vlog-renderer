# Skill finding from Iteration 02

## Observed failure

Iteration 02 earned an implementer simplicity/completion score of 95/100 and a
self-scored product pass. A later source-blind artifact reviewer scored the
rendered product 26/32 but found two mandatory categories below 3/4:
Environment fidelity 2/4 and Animation and life 2/4. The implementation had
already consumed three bounded refactor cycles.

The capture also proved the pure authored timeline returned to its nominal
start, but did not prove continuity of history-bearing VRM spring state. The
encoded transition from settled hair at frame 719 to wind-blown hair at frame 0
snapped visibly.

## Candidate v4 changes

1. Freeze perceptual artifact rubrics and identify independent-review categories
   before implementation.
2. Make the independent artifact-only result control mandatory perceptual gates;
   a failed category or open S0-S2 finding caps the effective score at 70 even
   when the implementer's raw score is higher.
3. Preserve self-score, independent score, dissent, isolation, cycle count, and
   controlling verdict as separate evidence.
4. Require sequential last-to-first evidence for loops with history-bearing
   simulation. Pure timeline equality is insufficient.
5. Enforce the same three-cycle limit after an independent failure; no hidden
   fourth cycle is created by a higher self-score.

## Expected routing examples

- Self-score 95, independent mandatory category 2/4, two open S2 findings,
  cycles 3/3: `COMPLETION_SCORE`, effective score at most 70, reject and preserve
  the branch. Do not refactor it again.
- Pure timeline equality passes, but the captured stateful hair transition
  snaps: the loop requirement is missing. Deduct at the frozen severity and do
  not mark capture readiness complete.
- Self-score 88 and all independent mandatory categories meet their frozen
  minimum with no open S0-S2 finding: the perceptual gate may pass, subject to
  the ordinary rubric and other external gates.
