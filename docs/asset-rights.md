# Asset rights ledger

No distributable third-party asset is accepted until its row contains an
authoritative source, exact version or digest, license or model permission,
redistribution status, required attribution, and verification evidence.

| Asset | Source and version | License or permission | Redistribution | Attribution | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| VRM character | `vrm-c/vrm-specification` commit `821c11b250d8c70d5804ee13431e42bee56ea9c0`, `VRM1_Constraint_Twist_Sample` v1.0.1 | VRM Public License 1.0; embedded metadata permits everyone, corporate commercial use, redistribution, and modified redistribution | Allowed | Embedded metadata says unnecessary; source is still credited in this repository | SHA-256 `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`; metadata audit recorded in `public/assets/CHARACTER_LICENSE.md` | Accepted |
| Iteration 02 shoreline plate | Original output created with OpenAI's built-in image generation tool on 2026-08-28; no input or reference image; model and request ID were not exposed | OpenAI Terms of Use effective 2026-01-01 assign Output to the user, subject to applicable law and third-party rights; publication policy requires review and AI disclosure | Accepted for this public prototype under the repository MIT license after direct visual review; output may not be unique | Disclose that the plate is AI-generated and name the repository owner as publisher | Original SHA-256 `b242519945029a950533124c2986f55735336ff23faaae71d5db7a68d9a9a284`; runtime SHA-256 `f8f79c043e26da590dd2b927d5160ff3f5e72e7ceb836b699f7febb6880cc1e9`; `public/assets/environment/shoreline-plate.provenance.json`; `docs/rights-receipts/openai-image-output-terms.md` | Accepted for prototype; human legal review remains a separate gate |
| Iteration 02 foreground stage | Project-authored Three.js geometry, generated textures, and shaders | Repository code license and dependency licenses | No standalone third-party image asset | None | Build source and lockfile | Accepted |
| Audio | No audio is required for the prototype | Not applicable | Not distributed | None | Product specification | Closed |

Code dependencies are recorded by package name, exact lockfile version, and
upstream license after installation.
