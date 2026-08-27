# Product specification

## Goal

Create a self-running browser demo that feels like a staff member filming a
character's quiet moment on a rugged coast. The environment uses physically
plausible light and materials; the character remains distinctly toon-shaded
with a clean outline while receiving scene light and shadow.

## Locked experience

- A real-time Three.js/WebGL scene renders without a blank frame or blocked
  start flow in a current desktop browser.
- The background contains a sky, moving ocean, sand beach, and visibly uneven
  rocks. Lighting, fog, reflections, and shadows form one coherent time of day.
- A valid VRM character loads through `@pixiv/three-vrm`, uses MToon-compatible
  shading and a clean silhouette outline, and remains legible against the
  photoreal background.
- The character performs a looping sequence with locomotion or body motion,
  secondary motion where supported, eye or head attention, and at least one
  quiet idle beat.
- A authored camera timeline follows the character, changes focal length or
  framing, introduces bounded handheld translation and roll, and includes at
  least one intentional close-up and one environmental shot.
- The demo exposes a deterministic capture mode so the same timeline can be
  recorded and evaluated.
- A minimal status surface distinguishes loading, ready, degraded fallback,
  and fatal failure. Failures identify the missing asset or unsupported feature.

The cinematic references are mood and rendering targets only. The project must
not copy protected characters, logos, environments, audio, or shot sequences.

## Rendering target

"URP-equivalent" means a compact browser pipeline with the practical features
needed by this scene: physically based environment materials, tone mapping,
shadow mapping, image-based or analytic sky light, water reflection cues,
depth/fog, and selective post-processing. It does not require Unity or parity
with every Universal Render Pipeline feature.

## Performance and compatibility

- Target: 1920x1080 capture at 30 fps on the development Mac.
- Interactive fallback: reduce pixel ratio and expensive reflections before
  removing required scene elements.
- A WebGL2-capable browser is the baseline. Unsupported capability is reported,
  not hidden behind a permanent loading screen.
- Capture must contain at least 20 seconds of the authored timeline.

## Evidence

- Production build exits successfully.
- Automated smoke test observes the ready state, advancing frame count, loaded
  VRM, required scene systems, and no fatal console or page errors.
- A browser capture and frame contact sheet show the close-up, follow shot,
  environmental shot, character outline, sea, sand, rocks, and sky.
- Asset licenses and model metadata are recorded in `docs/asset-rights.md`.
- Each branch receives a plan score and an implementation score using
  `docs/quality-rubric.md`; a score of 80 or below requires remediation.

## External gates

AI visual review is not a human audience test. Public GitHub, Dropbox sync, and
Sites deployment are separate gates and require their own receipts. Rights that
cannot be established from an authoritative license remain pending rather than
being inferred from technical availability.

