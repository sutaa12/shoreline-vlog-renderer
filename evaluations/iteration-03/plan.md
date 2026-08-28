# Original plate and real 3D contact implementation plan

## Routing state

`PLAN_SCORE`, with external gate `RIGHTS_PENDING` for a generated photographic
plate.

This is a large end-to-end production decision. The dominant environment
production method varies across all three candidates. A thin deterministic
frame kernel is shared execution infrastructure, not the comparison axis.

All three designs are technically viable. None is rejected before scoring.

## Corrected comparison

An isolated baseline-only challenge returned `REDESIGN_REQUIRED` because the
initial three topologies retained the same fully procedural real-time coast.
That comparison varied module organization while leaving the dominant
photoreal-environment risk untested. The challenge applied these exact
deductions:

- Requirement fit: `-5 S2`.
- Avoidable complexity: `-4 S2`.
- Testability and evidence: `-3 S2`.

The initial selection is superseded. This corrected selection compares three
different end-to-end environment production methods: fully procedural
real-time rendering, an original photographic plate with real 3D contact and
motion cues, and an offline-baked layered coast.

## Frozen contract

The selected implementation must provide:

- A self-running current-desktop WebGL2 Three.js scene with no blank frame or
  blocked start.
- A convincing coherent coast containing sky, moving ocean, sand, uneven
  rocks, fog, reflection cues, coherent light, and shadows.
- The existing VRM loaded through `@pixiv/three-vrm`, retaining loader-provided
  MToon fill and a clean character-only silhouette outline.
- Body or locomotion motion, gaze or head attention, supported secondary
  motion, and a quiet idle beat.
- Authored environmental, follow, reframing or zoom, and close-up shots with
  bounded handheld translation and roll.
- One authoritative 30 fps deterministic frame kernel and a 24-second authored
  phase.
- Sequential continuity: history-bearing camera, character, secondary, and
  environmental state continues through wrap without reset.
- A 1920x1080 capture of two uninterrupted cycles so the central loop boundary
  is directly reviewable.
- Truthful `loading`, `ready`, `degraded`, and `fatal` states.
- Performance fallback that reduces reflection and shadow cost before
  interactive pixel ratio and never removes required scene elements.
- Complete dependency and asset provenance.
- Independent artifact-only scoring in which every product category reaches at
  least 3/4 and no S0-S2 finding remains open.

Generated-image technical provenance does not close the rights gate. A
no-reference plate with complete prompt, source, model, terms, disclosure,
derivation, and hashes may proceed through technical implementation and the
explicitly requested disclosed evidence publication. Formal adoption and the
Originality and rights gate remain `RIGHTS_PENDING` until human legal
acceptance.

## Frozen evidence

The neutral reviewer packet must contain:

- A production-build receipt.
- Smoke JSON showing the ready event, advancing frames, loaded VRM and MToon
  materials, active outline, required environment systems, and zero fatal page
  or console errors.
- Exact VRM and environment-asset hashes.
- A two-run deterministic frame, cue, and state hash comparison.
- A 48-second two-cycle WebM at 1920x1080 with 30 requested frames per second.
- A contact sheet covering the environment, follow shot, close-up, quiet beat,
  character outline, moving ocean, sand, rocks, and sky.
- A sequential boundary strip for frames `N-3` through `N+3`, plus same-phase
  camera, pose, spring, and environment snapshots from consecutive cycles.
- A real-time 1080p performance receipt after warm-up, including median, p95,
  long frames, renderer, and effective quality tier.
- Environment-specific evidence for the horizon seam, foreground parallax,
  contact shadow, reflection match, and complete camera-envelope coverage.
- The rights and provenance receipt.

The reviewer packet contains no source, branch name, architecture label,
implementer self-score, or design discussion.

## Design 1 - Fully procedural real-time coast

| Aspect | Design or score |
| --- | --- |
| Dominant production method | Every visible coastal element is synthesized at runtime: analytic sky and PMREM, procedural moving ocean, shader-generated sand detail, seeded deformed rock geometry, fog, sun, shadows, and reduced-resolution reflection. |
| Real-time composition | One Three.js scene gives the character, coast, reflection, and camera shared light and depth. |
| Continuity and capture | The monotonic fixed-step kernel advances periodic world targets, camera history, and VRM secondary state through warm-up and authored wrap without reset. |
| Visual strength | True parallax, shadow, reflection, and camera freedom, with no plate seam or source-image rights dependency. |
| Requirement fit | **20/25**: `-5 S2`, convincing photographic microdetail and coast-wide coherence must be achieved entirely inside the 1080p runtime budget. |
| Avoidable complexity | **16/20**: `-4 S2`, custom sky, ocean, sand, rock, and reflection production forms a substantial bespoke rendering stack. |
| Robustness | **16/20**: `-4 S2`, performance fallback directly changes the systems carrying environment fidelity. |
| Change locality | **15/15**, no deduction. |
| Testability and evidence | **12/15**: `-3 S2`, the dominant realism risk is resolved only by late integrated perceptual artifacts rather than a separately inspectable source plate or bake. |
| Scope discipline | **5/5**, no deduction. |
| Total | **84/100 - viable and passing, but visually high-risk.** |

## Design 2 - Original photographic plate with real 3D coastal contact

| Aspect | Design or score |
| --- | --- |
| Dominant production method | A high-resolution, text-only, no-reference original coastal plate supplies sky, distant cliff, horizon, distant beach, and photographic atmosphere. It is projected as a bounded panoramic backdrop. |
| Real-time composition | Three.js supplies the moving ocean, near sand receiver, uneven foreground rocks, character shadow, fog bridge, plate-derived reflection and environment color, and enough foreground geometry for camera parallax. |
| Camera envelope | Camera translation stays inside a validated bounded volume. Foreground 3D parallax carries follow and handheld motion while distant plate content remains optically plausible. Environmental and close-up shots change framing and focal length without revealing the projection. |
| Continuity and capture | The monotonic fixed-step kernel drives ocean phase, camera smoothing, character state, and two-cycle capture. The plate is immutable; every history-bearing 3D system continues sequentially. |
| Visual strength | The dominant distant coast is photographically coherent, while real water, contact shadows, reflections, and foreground parallax prevent a pasted-background result. |
| Requirement fit | **24/25**: `-1 S3`, the generated master is 1672x941 rather than native 1920x1080, so the target capture needs about 1.15x upscaling and explicit close-up sharpness evidence. Human legal acceptance remains a separate external gate. |
| Avoidable complexity | **19/20**: `-1 S3`, plate-to-proxy calibration adds one bounded integration concept. |
| Robustness | **16/20**: `-4 S2`, the display-referred plate, moving 3D ocean, fog bridge, and dynamic light can expose a meaningful horizon or grading seam across authored shots. |
| Change locality | **15/15**, no deduction. |
| Testability and evidence | **15/15**, no deduction: the plate, masks, camera envelope, provenance, hashes, and runtime composite can all be inspected independently. |
| Scope discipline | **5/5**, no deduction. |
| Total | **94/100 - selected for technical implementation; adoption remains `RIGHTS_PENDING`.** |

## Design 3 - Offline-baked layered coast with runtime water and contact proxies

| Aspect | Design or score |
| --- | --- |
| Dominant production method | A deterministic offline browser bake produces high-sample shot panoramas or layers, depth or matte maps, atmospheric coast detail, and static lighting from repository-owned procedural inputs. Runtime uses those baked layers instead of synthesizing full coastal detail every frame. |
| Real-time composition | Shot-specific projected layers or shallow depth cards provide distant coast. A real Three.js ocean, near ground, proxy rocks, shadow catcher, fog, character, and reflection cues preserve motion and contact. |
| Camera envelope | Bake-time camera volumes cover the authored shots. Runtime translation and roll stay inside those volumes, with depth layers supplying bounded parallax. |
| Continuity and capture | One fixed-step runtime kernel continues camera, water, character, and supported secondary state through wrap. Bake outputs are immutable and hash-verified. |
| Visual strength | Offline oversampling and atmospheric layering improve distant quality while keeping 1080p runtime cost predictable and avoiding third-party imagery. |
| Requirement fit | **25/25**, no deduction. |
| Avoidable complexity | **12/20**: `-4 S2`, the offline bake is an additional production boundary; `-4 S2`, depth and layer projection duplicate part of the runtime environment representation. |
| Robustness | **16/20**: `-4 S2`, source, bake output, camera envelope, and runtime proxy geometry can drift out of agreement. |
| Change locality | **12/15**: `-3 S2`, a material environment change requires coordinated rebake and runtime-proxy verification. |
| Testability and evidence | **15/15**, no deduction: deterministic bake hashes, layer inspection, and runtime composite checks provide strong evidence. |
| Scope discipline | **5/5**, no deduction. |
| Total | **85/100 - viable and passing.** |

## Selection

Design 2 scores highest at **94/100** after the generated asset is included in
the plan evidence.

There is no tie. The frozen tie-break is fewer concepts, then direct
dependencies, state transitions, and budgeted files.

This selection authorizes technical implementation and visual evaluation. The
user's request separately authorizes a disclosed public technical-evidence
branch; that publication does not pass the Originality and rights category or
constitute formal legal acceptance. Generated-plate rights remain
`RIGHTS_PENDING` until a human accepts the recorded model terms, provenance,
disclosure, and intended use. If that gate is declined, Design 3 is the
highest-scoring rights-closed fallback and requires a new plan receipt; assets
must not be substituted silently inside Design 2.

An isolated baseline-and-asset challenge reviewed the corrected comparison and
returned `DEFENSIBLE`. It confirmed that the exact-three designs now differ by
environment production method. It retained the `-1 S3` plate-calibration and
`-4 S2` seam risks, added the native-resolution `-1 S3` above, and required no
architecture redesign.

## Selected architecture

### Environment production

Use the original text-only coastal panorama generated for this branch. Its
native master is 1672x941; the exact 16:9 crop is 1664x936. Do not describe it
as 6K or claim detail created by upscaling. The 1920x1080 capture must include
close-up sharpness evidence. The generation contract was:

- No input image or protected visual reference.
- No people, characters, brands, logos, identifiable landmarks, or copied shot
  sequence.
- One coherent overcast or late-afternoon sun direction.
- Rugged distant rocks, sand transition, ocean horizon, realistic atmospheric
  depth, and open foreground for the runtime character.
- Conservative framing that supports the frozen camera envelope.

Derive runtime assets without generative repainting:

- An optimized panorama.
- An ocean and horizon matte.
- A near-ground transition matte.
- Optional broad luminance and color sampling data for light and fog
  calibration.
- Exact hashes for the master, derivatives, prompt, and derivation receipt.

The runtime environment adds:

- A real animated ocean plane covering the plate's static water region.
- Fresnel and specular reflection sampling the plate as the distant
  environment.
- A fogged horizon band blending the runtime water into the plate.
- A PBR near-sand receiver under the character.
- A small seeded set of visibly uneven foreground rocks.
- Directional and ambient light calibrated from the plate.
- Character and foreground contact shadows.
- Reflection and shadow quality tiers that retain every required scene
  element.

The panorama is a projected environmental surface behind real geometry, not a
full-frame overlay.

### Runtime ownership

- `AppStatus` owns lifecycle, effective quality tier, and surfaced failures.
- `FrameKernel` owns monotonic frame, fixed capture step, interactive
  accumulator, seed, and authored phase.
- `EnvironmentSystem` owns plate validation, projection, water, sand receiver,
  rocks, fog bridge, lighting, and reflection.
- `CharacterSystem` owns VRM loading, MToon validation, body motion, gaze,
  supported secondary updates, outline, and shadows.
- `CinematicSystem` owns authored cues, camera target, focal length, bounded
  follow state, and handheld state.
- `CaptureBridge` commands the frame kernel and records evidence but owns no
  scene state.

### Sequential loop

- The authored phase is 24 seconds at 30 fps.
- Custom target curves are periodic with continuous position and first
  derivative.
- Camera smoothing and VRM secondary systems advance through complete
  sequential warm-up cycles.
- Same-phase state is compared after each warm-up cycle, with a five-cycle
  maximum.
- Capture fails explicitly if convergence is not reached.
- Two further cycles are recorded without resetting frame, camera, character,
  ocean, or secondary state.
- Boundary acceptance compares sequential `N-1`, `N`, and `N+1` deltas against
  the interior motion envelope and includes rendered boundary frames.

### Authored shot plan

- Environmental wide: plate, ocean, beach, rocks, sky, and character scale are
  all legible.
- Follow shot: bounded lateral motion relies on real foreground parallax.
- Medium reframing or zoom: focal length changes inside the validated
  projection envelope.
- Intentional close-up: MToon planes, outline, gaze, and coherent scene light
  are inspectable.
- Quiet beat and return wide: body motion settles without freezing secondary
  state.
- Handheld translation and roll use seeded integer-cycle signals with fixed
  caps and smooth cue envelopes.

### Status and failure behavior

- `loading`: WebGL2, plate hashes, renderer, reflection, and VRM initialize.
- `ready`: plate and VRM are accepted, required systems are active, and the
  frame advances.
- `degraded`: a named reflection, shadow, outline, or interactive-resolution
  tier reduction is active.
- `fatal`: unsupported WebGL2, missing or mismatched plate, missing or
  mismatched VRM, parse failure, renderer or shader failure, camera-envelope
  violation, capture capability failure, or evidence-export failure.

Every error identifies what failed, where, and the corrective action. Missing
dominant environment or character assets are fatal rather than hidden behind a
procedural substitute.

## Rights and provenance gate

Technical provenance records:

- The exact generation prompt and negative constraints.
- A declaration that no reference image was supplied.
- Provider, model or version where exposed, generation date, output identifier,
  and account receipt.
- The applicable provider terms URL and a captured or hashed terms receipt used
  for the decision.
- The original master hash.
- Every derivative asset hash.
- Exact deterministic conversion, crop, and matte commands.
- Disclosure that the plate is AI-generated.
- Intended repository, redistribution, modification, and commercial-use
  context.
- Human reviewer, decision, date, and accepted scope.

Until the human record is accepted:

- Technical implementation may build, capture, and receive visual scores.
- Originality and rights remains `PENDING`, not 3/4.
- The complete product gate cannot pass.
- Publication and external redistribution are blocked.

## Dependency and state budget

- Direct runtime packages: **2** - `three`, `@pixiv/three-vrm`.
- Direct development packages: **3** - `vite`, `typescript`,
  `@playwright/test`.
- Image generation: **one external production action**, not a runtime
  dependency.
- External runtime services: **0**.
- Browser boundary: **1** current Chromium used for automated capture.
- State owners: **5**.
- Capture bridge: no independent state domain.
- Observable decision branches: **10 or fewer**.
- Surfaced failure paths: **8 or fewer**.
- No UI framework, physics engine, animation library, HDRI, texture pack, state
  framework, or added post-processing package.
- Record the exact transitive dependency count and licenses after lockfile
  creation.

## File budget

The budget is exactly 16 source, configuration, script, test, and evaluation
files:

1. `package.json`
2. `package-lock.json`
3. `tsconfig.json`
4. `index.html`
5. `src/main.ts`
6. `src/style.css`
7. `src/contracts.ts`
8. `src/frame-kernel.ts`
9. `src/environment.ts`
10. `src/character.ts`
11. `src/cinematic.ts`
12. `src/capture.ts`
13. `playwright.config.ts`
14. `tests/acceptance.spec.ts`
15. `docs/asset-rights.md`
16. `evaluations/iteration-03/receipt.md`

Asset and provenance artifacts are outside the budget:

- Original master plate and runtime-optimized panorama.
- Ocean or horizon matte and ground-transition matte.
- Prompt and no-reference declaration.
- Generation, provider, and terms receipt.
- Master and derivative hash manifest.
- Derivation command receipt.
- Human rights decision.
- Generated video, contact sheet, boundary strip, performance JSON, smoke JSON,
  and neutral review packet.

A seventeenth budgeted file requires a responsibility that cannot remain
coherent in an existing owner.

## Acceptance commands

The implementation exposes these exact commands:

```bash
rtk npm ci
rtk npm run build
rtk npm run verify:rights
rtk npm run test:acceptance
rtk npm run capture:evidence
rtk npm run verify:evidence
```

Technical acceptance requires:

- All technical commands exit zero. Before human acceptance,
  `verify:rights` returns the documented `RIGHTS_PENDING` gate and never a
  false pass.
- Plate, derivatives, and VRM match recorded hashes.
- Smoke reaches ready, advances frames, loads VRM and MToon, and observes every
  required real-time scene system.
- The camera remains inside the validated plate-projection volume for the
  complete loop.
- Runtime ocean covers the plate's static water region without a visible
  double-wave seam.
- Contact shadow and foreground parallax remain coherent in every authored
  shot.
- Two runs match exact frame, cue, and state hashes.
- The 48-second capture contains two full sequential cycles and exposes the
  central wrap.
- Boundary state and images show no snap.
- Real-time 1080p performance meets the 30 fps target after warm-up.
- Independent artifact-only review scores every technical visual category at
  least 3/4 with no open S0-S2.
- Originality and rights reaches 3/4 or better only after the human rights
  decision is accepted.
- The completion simplicity score is recalculated from implementation
  evidence; this plan score does not transfer.

## Three bounded visual-refactor cycles

Each cycle begins only from a failed independent artifact finding or a
completion score of 80 or below. Stop when the completion score is at least 81,
all product categories are at least 3/4, no S0-S2 remains, and rights is
accepted. Do not issue a new score without new artifacts.

### Cycle 1 - Plate and 3D environmental integration

1. Recalibrate plate exposure, sun color and direction, and fog color as one
   change group.
2. Correct ocean matte, horizon blend, and water height.
3. Correct reflection strength and near-sand or rock material response.

Rerun all technical evidence and independent environment review.

### Cycle 2 - Character contact and toon integration

1. Correct MToon fill response without replacing loader-provided materials.
2. Tune character-only outline thickness and distance behavior.
3. Correct shadow or contact bias and foreground contrast.

Rerun close-up, environmental, and contact evidence.

### Cycle 3 - Camera, life, continuity, and performance

1. Retime focal and framing curves and constrain camera motion to the validated
   plate envelope.
2. Retune body motion, gaze, quiet beat, handheld envelope, and supported
   secondary convergence.
3. Reduce reflection and shadow cost inside the frozen fallback ladder while
   retaining every required scene element.

Rerun the full two-cycle capture, boundary checks, performance receipt, and
final independent review.

Every cycle receipt records the controlling score, cited evidence, at most
three changes, before and after owner, branch, or failure counts where affected,
all command results, the new score, and the stop reason.

## Risks and controls

- **Rights gate:** complete technical provenance still requires human legal
  acceptance. Publication remains blocked while pending.
- **Horizon seam:** runtime ocean may expose the plate's static water. Freeze a
  matte, fog bridge, and multi-shot seam evidence.
- **Double tone mapping:** make plate color-space and tone-mapping treatment
  explicit and calibrate 3D exposure against it.
- **Insufficient parallax:** keep camera translation bounded and tested; real
  sand, rocks, water, and character supply foreground parallax.
- **Pasted-in character:** use contact shadow, shared sun direction, ambient
  color, fog, reflection cues, and environmental and close-up review.
- **Limited VRM secondary structures:** detect support honestly and update every
  supported system sequentially.
- **Capture container variance:** exact deterministic claims apply to frame
  state, cues, and requested imagery, not byte-identical WebM containers.
- **1080p instability:** reduce reflection and shadow resolution before any
  interactive pixel-ratio change.

## Rollback

Rollback anchor: `skill-v4`.

If human rights acceptance is declined, preserve the evidence and open a fresh
Design 3 plan receipt. Do not replace the plate silently.

If an architectural S1 or S2 remains after three authorized cycles, preserve
the rejected artifacts, scores, and dissent; abandon the implementation and
restore the fixed baseline plus `skill-v4`. No implementation source carries
into the rollback state.

## Implementer brief

Implement the original-plate and real-3D-contact design with one renderer and
one deterministic frame kernel. First create and hash a text-only,
no-reference coastal plate and its complete provenance packet. Then build a
real moving ocean, near sand receiver, uneven foreground rocks, fog bridge,
plate-derived reflection and light, coherent shadows, VRM and MToon character,
authored bounded camera, and two-cycle deterministic capture.

Do not add dependencies or files beyond budget. Do not hide a missing plate,
failed hash, camera-envelope violation, or unsupported capability. Do not claim
product acceptance while generated-image rights remain pending. Completion
requires successful build and smoke evidence, stable 1080p capture, observable
sequential loop continuity, independent artifact-only scores of at least 3/4
in every category, no open S0-S2, a completion simplicity score of at least 81,
and human acceptance of the rights record.
