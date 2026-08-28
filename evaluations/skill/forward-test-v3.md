# Candidate skill v3 forward test

## Verdict

**Passed for project-local use.** V3 passed structural validation and two fresh,
isolated behavioral checks. It is not yet approved for global installation.

## Routing cases

| Case | Result |
| --- | --- |
| Existing-pattern static route | `OUT_OF_SCOPE`; focused implementation and checks, with no score or option ceremony. |
| Destructive deduplicator without artifacts | `EVIDENCE_BLOCKED`; no exact completion score and no destructive adoption. |
| Vendor-mandated single firmware shape | `CONSTRAINED_PLAN_SCORE`; constraint evidence excludes unsupported shapes and the sole admissible plan is scored without strawmen. |
| Verified score 74 without post-change evidence | The prior `COMPLETION_SCORE` remains controlling and the rescore is `EVIDENCE_BLOCKED`; no invented reductions, checks, or score. |

The constrained-plan case demonstrated the required evidence shape: source,
revision or date, section, stable location or digest, verified claim, and the
architecture that claim excludes.

## Deterministic score replay

A separate reviewer received only the current skill and this frozen finding
packet: requirement fit one S3; avoidable complexity two S2; robustness one S2;
change locality one S2; testability and evidence one S2; scope discipline no
findings.

It independently reproduced:

| Dimension | Calculation | Score |
| --- | ---: | ---: |
| Requirement fit | 25 - 1 | 24 |
| Avoidable complexity | 20 - 8 | 12 |
| Robustness | 20 - 4 | 16 |
| Change locality | 15 - 3 | 12 |
| Testability and evidence | 15 - 3 | 12 |
| Scope discipline | 5 - 0 | 5 |
| **Total** |  | **81/100** |

The reviewer correctly treated 81 as borderline, required a second independent
score from the same packet, and refused to pass the implementation on that score
alone.

## Final clarifications

The pass review raised only S3 findings. Before tagging, the skill was clarified
to:

- require provenance fields for constraint convergence;
- define dependency, state-owner, decision-branch, and failure-path counts;
- target the deductions that caused a low score rather than deletion alone;
- define an open `EVIDENCE_BLOCKED` refactor receipt;
- keep the last verified score controlling until new artifacts exist.

These changes preserve the tested behavior while making its receipts more
repeatable. The next evidence gate is a fresh real implementation branch.
