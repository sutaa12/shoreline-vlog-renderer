# Candidate skill v4 isolated forward test

## Isolation

A fresh high-tier evaluator received only the candidate
`simple-robust-implementation` skill and three synthetic evidence packets. It
was instructed not to inspect project source, history, evaluations, artifacts,
or earlier candidates, and it made no file changes.

## First run

- Packet A: `COMPLETION_SCORE`; implementer raw score 95, independent mandatory
  categories 2/4 and two open S2 findings, effective score capped at 70, reject.
  With 3/3 cycles consumed, the evaluator correctly refused a fourth local
  refactor cycle. Exact replay twice returned the same route, cap, and action.
- Packet B: `EVIDENCE_BLOCKED` for a precise full score because the packet did
  not include the complete implementation graph. The known S2 stateful
  719-to-0 snap still caps the eventual effective score at 70 and blocks
  completion; pure timeline equality cannot substitute.
- Packet C: `COMPLETION_SCORE`; raw score 88 is a numeric implementation pass,
  while human legal approval and audience testing remain separate external
  gates.

The first run found two wording ambiguities: a lightly renamed implementation
could appear to reset the three-cycle limit, and audience research was less
explicitly protected than legal approval.

## Revision and replay

The skill was revised to require a materially different large-design selection
from the frozen baseline before a cycle reset, and to state that named human,
legal, engine, store, account, deployment, and publication gates remain
separate evidence states.

The same evaluator re-read only the revised skill and replayed the same packets:

- Packet A produced the same deterministic `COMPLETION_SCORE`, 70 cap,
  rejection, and stop action twice. A rename, file move, restyle, or local
  revision cannot reset the cycle count.
- Packet B again kept the precise score `EVIDENCE_BLOCKED`, while the observed
  stateful snap controlled as an S2 missing requirement and pure timeline
  equality remained insufficient.
- Packet C again passed numerically at 88 without closing legal approval or
  audience testing. Each remains pending and blocks only the gate frozen for it.

## Verdict

`PASS`. Structural validation and isolated behavioral replay agree. No tested
wording permits a self-score to override independent evidence, a fourth local
cycle to be hidden by relabeling, pure-timeline evidence to replace stateful
continuity, or named external gates to be collapsed into a numeric completion
score.
