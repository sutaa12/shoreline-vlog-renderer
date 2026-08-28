# Simple Robust Implementation v5 — Independent Forward Test

## Purpose

Validate the post-demo skill change before global adoption. The change must:

- prove the highest-rework requirement with a bounded real-path feasibility
  spike before full expansion;
- keep that spike inside the selected design rather than treating it as a
  fourth option;
- stop repeated local tuning after the same mandatory perceptual category
  remains at 0–2 through one independently reviewed correction;
- route every large shape replacement through the same three-option or
  constrained-option rule;
- preserve separate legal and external gates.

## Structural Validation

Command:

```text
uv run --with pyyaml python /Users/snari/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/simple-robust-implementation
```

Result: exit 0, `Skill is valid!`

## Reviewer Isolation

A fresh reviewer received only the v5 `SKILL.md` and five adversarial packets.
It did not inspect repository history, prior skill versions, prior evaluations,
or the demo implementation. The first review found three routing ambiguities;
the smallest corrections were applied. The same reviewer then reran the full
packet set against the revised file.

## Final Packet Results

| Packet | Required result | Final result |
| --- | --- | --- |
| A — large perceptual product | `PLAN_SCORE`, exactly three initial options, then a bounded real-path spike; a failed spike stops expansion | PASS; the spike is explicitly inside the selected option and cannot become a fourth option |
| B — consecutive independent 2/4 reviews | Keep the effective cap; prohibit another same-representation tuning cycle; select a materially different shape or preserve rejection | PASS; no constant, shader/material, overlay, keyframe, cycle-reset, or score-inflation loophole remains |
| C — tiny patterned fix | `OUT_OF_SCOPE` with focused checks and no manufactured options | PASS |
| D — only two authoritative viable architectures | `CONSTRAINED_PLAN_SCORE`; enumerate and score both shapes, then apply the normal tie-break | PASS; no invented third option or arbitrary omission remains |
| E — raw 88 with missing legal approval | Preserve the implementation score while keeping adoption/release blocked on the separate legal gate | PASS; no gate collapse |

## Verdict

`PASS`

The revised rules are deterministic and mutually consistent across all five
packets. The v5 skill is structurally valid and behaviorally forward-tested for
global adoption.
