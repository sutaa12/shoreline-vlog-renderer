---
name: simple-robust-implementation
description: "Review substantial implementation plans and completed implementations for the simplest robust solution, score them from 0 to 100, require refactoring at 80 or below, and choose one of exactly three options for large designs. Use before cross-cutting implementation and again when the designed scope is complete. Do not use for tiny local fixes or to override architecture explicitly chosen by the user."
---

# Simple Robust Implementation

Simplicity means fewer moving parts while preserving every locked requirement. It
does not mean shrinking the requested product, removing failure handling, or
substituting a mock for working behavior.

## Freeze the contract

Before scoring, list the goal, locked requirements, evidence needed for each
requirement, and the files or systems in scope. Treat user-selected technology
and external approval boundaries as constraints, not as complexity to delete.

Classify the work as large when any of these is true:

- it changes three or more modules or runtime systems;
- it adds a framework, service, persistence boundary, build path, or deployment;
- a wrong design would cause broad rework or an S0-S2 failure;
- the work is a multi-phase project rather than one coherent local change.

Do not manufacture alternatives for smaller work.

## Choose a large design from three options

For large work, produce exactly three viable options from the same locked
requirements. Make them meaningfully different, never one preferred option and
two strawmen. Include the simplest direct option, a balanced option, and a
specialized option only when all three can actually meet the contract.

Score all three with the rubric below. Reject an option before scoring if it
cannot satisfy an explicit requirement, relies on unverified rights or external
authority, or has no credible verification path. Adopt the highest-scoring
option. Break ties in favor of fewer concepts, dependencies, state transitions,
and files touched.

## Score plans and completed work

Use the same 100-point rubric before implementation and after the designed scope
is complete:

| Dimension | Points | Full-credit evidence |
| --- | ---: | --- |
| Requirement fit | 25 | Every locked requirement maps to implementation and a concrete acceptance check. |
| Avoidable complexity | 20 | Each dependency, abstraction, state owner, and execution path is necessary now. |
| Robustness | 20 | Known failures are bounded, surfaced, recoverable where required, and leave no open S0-S2 issue. |
| Change locality | 15 | Responsibilities and ownership are clear; a normal change has a small, predictable blast radius. |
| Testability and evidence | 15 | Cheap focused checks exist, important runtime behavior is observable, and claims bind to current artifacts. |
| Scope discipline | 5 | No speculative feature, compatibility layer, or premature generalization was added. |

Give concrete observations for every dimension. Do not award points for intent,
file names, comments, or tests that do not exercise the claim. A missing locked
requirement caps the score at 70. An unverified rights, safety, destructive, or
external-approval dependency blocks adoption regardless of the numeric score.

At the completion gate, inspect the actual dependency graph, state ownership,
control flow, failure paths, tests, and runtime evidence. Do not reuse the plan
score as the implementation score.

## Act on the score

- `81-100`: pass. Record remaining S3 polish separately.
- `61-80`: refactor before continuing or declaring completion.
- `0-60`: replace the plan or implementation shape; local cleanup is unlikely to
  be sufficient.

At 80 or below, select at most three changes with the largest verified reduction
in concepts, dependencies, branching, or failure surface. Preserve observable
behavior, apply the changes when authorized, rerun the relevant checks, and
score again with the same rubric. Do not broaden into unrelated cleanup.

Repeat for at most three safe refactor cycles. Stop earlier when the score is at
least 81. If it remains at 80 or below, identify the exact locked constraint,
missing evidence, or authority needed; never relabel the result as passing.

## Report

Return the scale classification, locked requirements, three options when
required, score breakdown, selected design, required refactors, verification
results, remaining risks, and the next gate. Keep the report proportional to the
decision; the gate should remove complexity, not become a second project.
