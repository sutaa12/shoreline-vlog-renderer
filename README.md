# Shoreline Vlog Renderer

A browser-rendered cinematic study that combines a photographic shoreline
plate, real-time Three.js ocean/contact layers, an animated MToon VRM
character, and a handheld staff-camera rig.

The repository is also a controlled evaluation of the bundled
`simple-robust-implementation` skill. Each implementation branch starts from
the same locked specification, is built without reading earlier implementations,
and is scored with the same pre- and post-implementation rubric.

This branch preserves Iteration 03, the strongest technical candidate. Its
build, browser runtime, deterministic 48-second capture, 24-second sequential
boundary, and performance gates pass. The final independent visual review does
not: toon/photoreal integration and animation/life remain at 2/4, so the
effective completion score is capped at 70/100 and the branch is not an
accepted product candidate. Formal human/legal acceptance of the generated
environment plate is also `RIGHTS_PENDING`.

## Run and verify

```sh
npm ci
npm run build
npm run verify:rights
npm run test:acceptance
npm run capture:evidence
npm run verify:evidence
```

Use `npm run dev` for the interactive browser runtime. The generated beach
disclosure remains visible in the rendered output. The authoritative results,
hashes, timing, gate decision, and allowed-cycle history live in
[the Iteration 03 receipt](evaluations/iteration-03/receipt.md); the rejected
final visual decision is in
[the Cycle 3 blind review](evaluations/iteration-03/blind-review-cycle-3.md).

The comparison report is deployed owner-only at
[Shoreline Vlog Renderer — Controlled Field Report](https://shoreline-vlog-field-report.narinarinari.chatgpt.site/).
The rejected final technical capture is synchronized to Dropbox at
`/ShorelineVlogRenderer/shoreline-vlog-iteration-03-rejected-final.mp4`;
no shared link was created.

## Preserved experiment branches

- `iteration/01-direct-cinematic`: fully procedural baseline; independent
  artifact score 18/32 and rejected.
- `iteration/02-photographic-hybrid`: photographic backdrop with procedural
  foreground; independent artifact score 26/32, but rejected because two
  mandatory categories remained below 3/4.
- `iteration/03-original-plate-contact`: original no-reference environment
  plate with minimal real-time ocean/contact layers; strongest technical
  result, but rejected after the third and final visual refinement cycle.

The validated v5 skill is kept on `main` under
`skills/simple-robust-implementation/`. It adds a representative feasibility
spike before full expansion and stops repeated same-representation tuning after
the same mandatory perceptual category fails twice.

See [the product specification](docs/product-spec.md),
[quality rubric](docs/quality-rubric.md), and
[iteration protocol](docs/iteration-protocol.md).
