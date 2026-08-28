---
name: simple-robust-implementation
description: "Review substantial implementation plans and completed implementations for the simplest robust solution, score evidence from 0 to 100, require refactoring at 80 or below, and compare exactly three viable options when a large architectural decision or implementation-shape replacement is open. Use before consequential cross-cutting implementation and again when its designed scope is complete. Do not use for tiny local fixes, bounded work that follows an existing pattern, or to override architecture explicitly chosen by the user."
---

# Simple Robust Implementation

Simplicity means fewer moving parts while preserving every locked requirement. It
does not mean shrinking the requested product, removing failure handling, or
substituting a mock for working behavior.

## Route before scoring

Return one explicit state before doing the rest of the workflow:

- `OUT_OF_SCOPE`: the change is small, local, and follows an existing bounded
  pattern. State the focused checks; do not score it or manufacture options.
- `PLAN_SCORE`: a consequential design decision is open and the supplied plan
  evidence is sufficient for a 0-100 score.
- `CONSTRAINED_PLAN_SCORE`: verified user, vendor, platform, rights, or safety
  constraints leave fewer than three viable shapes. Record the excluded shapes
  and constraint evidence with source, revision or date, section, stable
  location or digest, claim, and exclusion. Then score the remaining admissible
  plan; do not invent alternatives or block a valid mandatory architecture.
- `COMPLETION_SCORE`: current implementation, dependency, test, and runtime
  artifacts are available for a 0-100 completion score.
- `EVIDENCE_BLOCKED`: plan or completion artifacts are missing or stale. List
  the exact evidence required. If useful, give a clearly labeled provisional
  range, never a precise plan or completion score.
- `DESIGN_BLOCKED`: a large-plan selection or shape replacement is required but
  neither three viable non-strawman options nor verified constraint convergence
  can be established. Explain what evidence or decision is missing; do not
  invent alternatives.

## Freeze the contract

Before scoring, list the goal, locked requirements, evidence needed for each
requirement, and the files or systems in scope. Treat user-selected technology
and external approval boundaries as constraints, not as complexity to delete.

Classify a decision as large when its chosen shape materially affects the
architecture and any of these is true:

- it changes three or more modules or runtime systems;
- it introduces or replaces a framework, service, persistence boundary, build
  path, or deployment shape;
- a wrong design would cause broad rework or an S0-S2 failure;
- the work is a multi-phase project rather than one coherent local change.

Adding one bounded path inside an already selected architecture is not large by
itself. Do not manufacture alternatives for smaller work.

## Choose a large design from three options

Produce exactly three viable options only for an initial large-plan selection or
when a score of 60 or below requires replacing the implementation shape. Make
the options meaningfully different, never one preferred option and two
strawmen. Include the simplest direct option, a balanced option, and a
specialized option only when all three can actually meet the contract. If three
do not exist, use `CONSTRAINED_PLAN_SCORE` only when authoritative constraints
prove why; otherwise return `DESIGN_BLOCKED`.

Score all three with the rubric below. Reject an option before scoring if it
cannot satisfy an explicit requirement, relies on unverified rights or external
authority, or has no credible verification path. Adopt the highest-scoring
option. Break ties in favor of fewer concepts, dependencies, state transitions,
and files touched.

## Score plans and completed work

Use the same 100-point rubric before implementation and after the designed scope
is complete. Severity means:

- `S0`: catastrophic safety, security, data-loss, or public-integrity failure;
- `S1`: a core locked requirement or release path is broken;
- `S2`: a meaningful correctness, robustness, or product-quality fix is needed;
- `S3`: bounded polish that does not block the current gate.

Start every dimension at its maximum and apply these fixed deductions for each
independent finding assigned to that dimension:

| Dimension | Maximum | S3 deduction | S2 deduction | S1 deduction | S0 result |
| --- | ---: | ---: | ---: | ---: | ---: |
| Requirement fit | 25 | -1 | -5 | -10 | 0 |
| Avoidable complexity | 20 | -1 | -4 | -8 | 0 |
| Robustness | 20 | -1 | -4 | -8 | 0 |
| Change locality | 15 | -1 | -3 | -6 | 0 |
| Testability and evidence | 15 | -1 | -3 | -6 | 0 |
| Scope discipline | 5 | -1 | -2 | -4 | 0 |

Floor each dimension at zero. Assign a finding to one primary dimension. Deduct
it elsewhere only for a separate, evidenced consequence, and name that
consequence to prevent double counting. Classify one minor redundant helper as
S3; an unnecessary dependency, state owner, or meaningful failure gap as S2;
and a parallel unused architecture, broken core path, or unbounded destructive
failure as S1. S0 uses the definition above.

Give concrete observations for every dimension. Do not award points for intent,
file names, comments, or tests that do not exercise the claim. A missing locked
requirement caps the score at 70. An unverified rights, safety, destructive, or
external-approval dependency blocks adoption regardless of the numeric score.
State every deduction and the artifact that caused it; do not tune the number to
reach a desired verdict.

Scores from 79 through 82 are borderline. Require a second independent score
from the same frozen contract and evidence packet. Pass only when both scores
are at least 81; otherwise resolve the cited evidence difference or refactor.

At the completion gate, inspect the actual dependency graph, state ownership,
control flow, failure paths, tests, and runtime evidence. Do not reuse the plan
score as the implementation score.

Use stable counts when comparing implementation shape:

- dependency: a direct package, process, service, or external runtime boundary;
  report transitive packages separately;
- state owner: a component authorized to mutate one coherent state domain;
- decision branch: a reachable conditional outcome that changes observable
  behavior or recovery, not a syntax-only guard;
- failure path: one distinct fault source and its surfaced or recovery outcome.

## Act on the score

- `81-100`: pass. Record remaining S3 polish separately.
- `61-80`: refactor before continuing or declaring completion.
- `0-60`: replace the plan or implementation shape; local cleanup is unlikely to
  be sufficient.

At 80 or below, select at most three changes that directly mitigate the findings
that caused the deductions. For complexity or locality findings, prefer the
largest verified reduction in concepts, dependencies, state owners, branches,
or failure paths. For fit, robustness, evidence, or scope findings, fix the
missing coverage or behavior instead of deleting surface for its own sake.
Preserve observable behavior, apply the changes when authorized, rerun the
relevant checks, and score again with the same rubric. Do not broaden into
unrelated cleanup.

Repeat for at most three safe refactor cycles. Stop earlier when the score is at
least 81. If it remains at 80 or below, identify the exact locked constraint,
missing evidence, or authority needed; never relabel the result as passing.

Record every cycle with this compact receipt:

1. baseline score and current evidence;
2. at most three authorized changes;
3. before/after counts for the affected concepts, dependencies, state owners,
   branches, or failure paths;
4. commands or checks and their results;
5. new score and stop reason.

Count replacements as well as removals. A lower raw count is not an improvement
when custom code recreates a dependency or a consolidated owner becomes a mixed-
responsibility god object. Record the net surface and whether ownership became
more coherent. Do not issue a new score until the post-change graph and checks
exist; the prior score remains controlling.
When post-change artifacts are unavailable, mark after-values, checks, and the
new score `unavailable`, route `EVIDENCE_BLOCKED`, and keep the last verified
score and its required action controlling.

## Report

Return the routing state, scale classification, locked requirements, three
options when required, score breakdown, selected design, required refactors,
verification results, remaining risks, and the next gate. Keep the report
proportional to the decision; the gate should remove complexity, not become a
second project.
