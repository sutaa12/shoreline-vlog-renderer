# Shoreline Vlog Renderer

A browser-rendered cinematic study that combines a physically lit shoreline
with an animated MToon VRM character and a handheld staff-camera rig.

The repository is also a controlled evaluation of the bundled
`simple-robust-implementation` skill. Each implementation branch starts from
the same locked specification, is built without reading earlier implementations,
and is scored with the same pre- and post-implementation rubric.

See [the product specification](docs/product-spec.md), [quality rubric](docs/quality-rubric.md),
and [iteration protocol](docs/iteration-protocol.md).

## Run the cinematic

Install the locked dependencies, then start the Vite development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The status card reports character loading,
ready, degraded fallback, or fatal startup failure. Add `?quality=capture` for a
one-device-pixel-per-CSS-pixel recording tier, or `?quality=fallback` to lower
reflection and shadow cost while retaining every scene element.

The timeline's recording button captures one deterministic 24-second WebM loop
from the canvas. Runtime evidence is also available at `window.__SHORELINE__`;
the object exposes the current frame, shot, VRM/material state, scene systems,
errors, and capture state.

## Verify and capture

```sh
npm run build
npm test
npm run capture
```

Run `npm run build` before `npm run capture`; the capture command serves the
production output in Chrome, records at 1920×1080, and writes the video, contact
sheet, final frame, and machine-readable manifest under
`artifacts/iteration-01/`.
