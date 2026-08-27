# Iteration 01 plan gate

## Scale

Large. The work introduces a render pipeline, character runtime, authored
camera system, browser capture, and deployment path across more than three
modules.

## Locked requirements

The product contract is `docs/product-spec.md`. Evidence must cover every
environment element, valid animated VRM loading, toon/light/shadow integration,
follow/zoom/shake/close/environment camera beats, deterministic capture, status
and failure states, build success, and runtime smoke behavior.

## Decision

ADR 0001 compares exactly three viable designs and adopts the real-time
single-canvas scene.

## Score

| Dimension | Score | Observation |
| --- | ---: | --- |
| Requirement fit | 24/25 | The design maps every locked runtime requirement; final visual comfort still requires human judgment. |
| Avoidable complexity | 17/20 | Four modules and two runtime dependencies are sufficient; custom water, outline, and capture logic remain necessary complexity. |
| Robustness | 18/20 | Loading, unsupported capability, quality fallback, and recording duration are bounded; real-time frame drops remain a measured risk. |
| Change locality | 14/15 | Scene, character, cinematic time, and lifecycle have single owners with narrow interactions. |
| Testability and evidence | 14/15 | Seeded time and browser-visible diagnostics support deterministic checks; photoreal balance cannot be automated conclusively. |
| Scope discipline | 5/5 | No editor, server, muxer, physics framework, or speculative extensibility is included. |
| **Total** | **92/100** | Passes the 81-point implementation threshold. |

## Dependency and file budget

- Runtime dependencies: at most two.
- Dev/build/test dependencies: at most four unless a failing acceptance check
  proves another one necessary.
- Owned source modules: four.
- Handwritten source, test, and configuration files: target 15 or fewer,
  excluding the locked VRM and generated output.

## Rollback

Delete the branch and return to tag `spec-v1`. No implementation file is shared
with another attempt.
