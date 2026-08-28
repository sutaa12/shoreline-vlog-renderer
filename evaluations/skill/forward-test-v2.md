# Candidate skill v2 forward test

## Verdict

**Failed for project-local use.** Structural validation passed, but an isolated
four-case behavioral test found two major defects. V2 was neither tagged nor
used for a new implementation.

## Cases

| Case | Expected pressure | V2 result |
| --- | --- | --- |
| Existing-pattern Vite route | Avoid ceremony for a bounded change | Correctly returned `OUT_OF_SCOPE` with focused route, build, and deploy checks. |
| Destructive deduplicator without artifacts | Refuse an invented completion score | Correctly returned `EVIDENCE_BLOCKED` and kept destructive adoption blocked. |
| Vendor-mandated firmware architecture | Avoid strawmen when only one shape is valid | Returned `DESIGN_BLOCKED`, creating a permanent dead end despite authoritative constraints. |
| Verified completion score of 74 | Apply a bounded refactor receipt | Correctly selected no more than three changes and refused to invent after-counts, checks, or a new score. |

## Findings

### Major

1. A valid architecture with fewer than three shapes had no constraint-validated
   path to planning and scoring.
2. Broad partial-credit bands allowed reviewers to cross the mandatory 80/81
   threshold from the same evidence.

### Moderate

1. `EVIDENCE_BLOCKED` sounded completion-specific even though a plan can also be
   unscoreable.
2. Raw count reductions could hide replacement code or an over-centralized
   state owner.

## V3 decisions

- Add `CONSTRAINED_PLAN_SCORE` for authoritative user, vendor, platform, rights,
  or safety constraints that genuinely converge the design.
- Reserve `DESIGN_BLOCKED` for missing evidence or decisions rather than a valid
  mandatory architecture.
- Replace broad score bands with fixed S3/S2/S1 deductions per dimension and a
  no-double-counting rule.
- Require a second independent score in the 79-82 borderline.
- Make `EVIDENCE_BLOCKED` cover plans and completions.
- Count replacement surface and ownership coherence in every refactor receipt;
  keep the old score controlling until post-change evidence exists.

V3 must pass structural validation and another isolated behavioral test before
it can be used project-locally.
