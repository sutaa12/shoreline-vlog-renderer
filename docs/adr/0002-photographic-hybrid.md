# ADR 0002: photographic far field with a real 3D contact stage

## Status

Accepted for Iteration 02 only.

## Decision

Use a project-generated photographic plate for the distant coast and a real
Three.js foreground stage for sand, water, rocks, fog, reflections, character
contact, and camera parallax. Keep camera travel inside the recorded calibration
envelope and render deterministic browser frames for constant-cadence capture.

## Why

The far-field image solves the hardest photographic material and atmospheric
detail with one owned asset. Real foreground geometry preserves the requested
camera behavior and prevents the toon character from reading as a flat overlay.
The design retains two runtime dependencies and one browser renderer.

## Consequences

- The plate must have authoritative output-ownership and publication receipts,
  explicit AI-generated disclosure, an untouched original, a hashed derivative,
  and manual review for protected or recognizable content.
- Camera motion is intentionally bounded; unrestricted free camera is out of
  scope.
- Plate decode or calibration failure is surfaced and cannot produce accepted
  capture evidence.
- The rollback is the public `skill-v3` tag. A failed plate does not justify
  importing another iteration's implementation shape.
