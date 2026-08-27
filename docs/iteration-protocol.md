# Iteration protocol

## Fixed baseline

The `main` branch contains only the locked specification, evaluation skill,
asset ledger, and evidence schema. Tag this baseline before implementation.

Each implementation branch starts from that tag. Its implementer receives the
specification, acceptance commands, and candidate skill, but no prior branch,
review, score, or implementation discussion. This is the operational meaning of
starting again without remembering an earlier attempt.

## Branch sequence

Run no more than three implementation attempts:

1. `iteration/01-<selected-shape>`
2. `iteration/02-<selected-shape>`
3. `iteration/03-<selected-shape>`

Do not merge one attempt into the next. A new attempt may use an improved skill,
but it begins from the same product baseline plus that explicitly versioned
skill revision.

## Per-attempt gates

1. Produce exactly three designs because this project is large; score and adopt
   one with the candidate skill.
2. Record the plan, score, dependency budget, expected files, and rollback.
3. Implement the complete selected design.
4. Build, run automated smoke checks, capture the browser timeline, and preserve
   evidence.
5. Run a fresh artifact-only review with neutral candidate labels.
6. Score the completed implementation. At 80 or below, refactor and repeat the
   same checks before closing the attempt.
7. Record demonstrated skill failures and make only evidence-supported skill
   changes before the next attempt.

## Selection

After the final allowed attempt, compare accepted artifacts with the same
product rubric. Keep every result, including failed attempts and dissenting
reviews. Publish the best accepted branch; the previous accepted branch or the
baseline tag is its rollback path.

