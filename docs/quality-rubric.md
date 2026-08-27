# Quality rubric

## Simplicity and robustness gate

Use the scorecard in `skills/simple-robust-implementation/SKILL.md` before code
is written and again after the branch's designed scope is complete. Passing is
81 or higher; any score of 80 or lower requires refactoring and re-evaluation.

The plan and implementation scores are independent. A strong plan does not
transfer points to code that diverged from it.

## Product gate

Score each category from 0 to 4. Every mandatory category must score at least 3;
an average cannot hide a correctness failure.

| Category | 4 | 3 | 2 | 1 | 0 |
| --- | --- | --- | --- | --- | --- |
| Runtime correctness | Ready state and authored loop run without fatal errors; evidence is reproducible. | Works with a minor non-blocking issue. | Meaningful fix required. | Major flow needs assistance. | Missing, blank, or blocked. |
| Environment fidelity | Sky, ocean, sand, rocks, light, fog, and reflections read as one convincing coast. | Complete with minor visual weakness. | Several elements look synthetic or disconnected. | Environment is placeholder quality. | Missing. |
| Toon/photoreal integration | VRM retains clean toon planes and outline while receiving coherent light and shadow. | Works with a minor artifact. | Toon identity or scene integration weakens materially. | Character looks pasted in or unreadable. | Missing. |
| Animation and life | Motion, gaze/attention, secondary response, and quiet beat form a believable loop. | Complete with minor stiffness. | Limited or visibly mechanical. | Bare transform motion only. | Static or missing. |
| Camera authorship | Follow, zoom/framing change, bounded shake, close-up, and environmental shot feel intentional. | All beats exist with minor roughness. | One beat missing or camera feels procedural. | Basic orbit/pan only. | Static or broken. |
| Capture readiness | Deterministic 20s+ mode, clean frame, and reproducible video/contact sheet. | Works with minor manual setup. | Capture is inconsistent or incomplete. | Only screenshots or synthetic stand-in. | No capture. |
| Performance | 1080p target is measured and stable enough for capture; fallback is graceful. | Small stutter without broken motion. | Material instability. | Frequent stalls. | Cannot progress. |
| Originality and rights | Assets and references are traceable; result is distinct and redistributable. | Minor attribution cleanup only. | Rights or reference-distance question needs work. | Major uncertainty. | Infringing or unverifiable. |

S0-S2 findings fail the product gate until mitigated. S3 findings are preserved
as polish opportunities and do not automatically block a prototype.

