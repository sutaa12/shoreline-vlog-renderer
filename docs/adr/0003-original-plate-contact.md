# ADR 0003: Original plate with real 3D coastal contact

## Status

Accepted for technical implementation; `RIGHTS_PENDING`.

## Context

The demo needs a coherent photographic coast, a moving ocean, real character
contact and shadows, authored camera motion, deterministic capture, and stable
1080p performance. A comparison that varies only module topology does not test
the dominant environment-fidelity risk. The architecture selection therefore
compares fully procedural real-time production, an original photographic plate
with real 3D contact, and an offline-baked layered environment.

The original-plate design scores 94/100, versus 84/100 for fully procedural
real-time production and 85/100 for the offline-baked layered design. Its main
technical risk is the seam between the display-referred plate and the moving
3D ocean, fog, reflection, lighting, and shadows. That risk has a direct
artifact-based verification path.

The generated master is 1672x941 and its exact 16:9 crop is 1664x936. This is
below native 1920x1080 and creates a recorded S3 softness risk, so the final
evidence must include 1080p close-up sharpness inspection. No 6K claim is made.

## Decision

Use a high-resolution, text-only, no-reference original coastal plate for the
distant sky, cliff, horizon, beach, and atmosphere. Render the character and
the following contact and motion cues in real-time Three.js:

- Moving ocean covering the plate's static water region.
- Near sand shadow receiver.
- Uneven foreground rocks.
- Fogged horizon bridge.
- Plate-derived reflection and environment color.
- Coherent directional and ambient light.
- VRM character with loader-provided MToon fill, clean outline, and shadows.

Keep the camera inside a validated projection envelope. Real foreground water,
sand, rocks, and character motion provide parallax for the authored
environmental, follow, reframing, close-up, and bounded handheld shots.

Use one monotonic deterministic frame kernel. Authored phase may wrap, but
history-bearing camera, ocean, character, and supported secondary state must
not reset. Warm sequential cycles to convergence, then capture two uninterrupted
cycles at 1920x1080 and 30 requested frames per second.

## Technical and external gates

Technical acceptance covers build, runtime readiness, VRM and MToon loading,
environment integration, sequential loop continuity, deterministic state,
authored shots, 1080p performance, failure states, and independent artifact-only
visual review.

Rights acceptance is separate. Record the exact prompt, no-reference
declaration, provider and model information, applicable terms receipt,
disclosure, master and derivative hashes, derivation commands, intended use,
and human decision. Technical work and visual review may proceed while this
record is pending, but originality and rights cannot score 3/4 and formal
adoption cannot pass until a human accepts the rights record. The user's request
separately authorizes a disclosed public technical-evidence branch; publishing
that branch does not close or waive the human rights gate.

No technical score, source availability, or successful capture closes the
human rights gate.

## Consequences

- Distant coastal fidelity is supplied by an independently inspectable source
  plate rather than a large runtime procedural shader stack.
- Runtime cost remains concentrated in the moving ocean, contact geometry,
  character, shadows, and bounded reflection cues.
- Camera motion is intentionally constrained by the projection envelope.
- Horizon blend, color-space treatment, contact shadow, reflection match, and
  foreground parallax become mandatory evidence.
- Missing or mismatched plate assets and camera-envelope violations are fatal,
  not silently replaced with a low-fidelity background.
- If the human rights gate is declined, the offline-baked layered design needs
  a new plan receipt; assets are not silently substituted inside this
  architecture.

## Adoption gate

Adoption requires all product categories at 3/4 or better, no open S0-S2, a
completion simplicity score of at least 81, successful two-cycle boundary and
1080p evidence, and an accepted human rights record.

## Rollback

Rollback anchor: `skill-v4`.

On declined rights, preserve the evidence and route to a newly scored
rights-closed design. On unresolved architectural S1 or S2 after the three
authorized refactor cycles, preserve the rejected evidence and restore the
fixed baseline plus `skill-v4` without carrying implementation source forward.
