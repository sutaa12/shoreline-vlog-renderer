# Asset rights ledger

No distributable third-party asset is accepted until its row contains an
authoritative source, exact version or digest, license or model permission,
redistribution status, required attribution, and verification evidence.

| Asset | Source and version | License or permission | Redistribution | Attribution | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| VRM character | `vrm-c/vrm-specification` commit `821c11b250d8c70d5804ee13431e42bee56ea9c0`, `VRM1_Constraint_Twist_Sample` v1.0.1 | VRM Public License 1.0; embedded metadata permits everyone, corporate commercial use, redistribution, and modified redistribution | Allowed | Embedded metadata says unnecessary; source is still credited in this repository | SHA-256 `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`; metadata audit recorded in `public/assets/CHARACTER_LICENSE.md` | Accepted |
| Iteration 03 coastal plate | Original no-reference image generated with OpenAI through Codex imagegen on 2026-08-28; output `exec-73438db8-1b24-4af7-a302-1ba6e4264538` | OpenAI Terms of Use; technical ownership and publication-policy receipt recorded, formal human legal review not completed | User authorized public prototype publication; broader legal acceptance remains pending | Visible AI-generated environment disclosure required | Original SHA-256 `67e2cf41c915e4e0101ed1f96eece0ad92e1f00c9cad6bba8b59cd9bb282d457`; runtime SHA-256 `ce16e6892f7a7c369e73390a23fe1043f68446c3a565bd96a853d53e386d9fed`; full prompt, output ID, derivations, and terms receipt recorded under `public/assets/environment/iteration-03/` and `docs/rights-receipts/` | Technical provenance accepted; `RIGHTS_PENDING` |
| Environment textures/HDRI | Procedural shaders and generated geometry only | Repository code license and dependency licenses | No standalone third-party image asset | None | Build source and lockfile | Accepted |
| Audio | No audio is required for the prototype | Not applicable | Not distributed | None | Product specification | Closed |

## Code dependencies

`package-lock.json` is the version authority. The installed graph contains five
direct packages and 31 physically installed transitive packages; the lockfile
also records 80 platform-inclusive package entries. `npm ci` reported no known
vulnerabilities at technical acceptance.

| Direct package | Version | Use | License |
| --- | --- | --- | --- |
| `three` | 0.185.1 | Runtime renderer and scene graph | MIT |
| `@pixiv/three-vrm` | 3.5.5 | Runtime VRM loader, MToon, humanoid, and spring update | MIT |
| `vite` | 8.2.2 | Production build and preview server | MIT |
| `typescript` | 7.0.2 | Source checking | Apache-2.0 |
| `@playwright/test` | 1.62.1 | Browser acceptance and evidence capture | Apache-2.0 |

Across the 80 lockfile package entries, declared licenses are MIT (41),
Apache-2.0 (25), MPL-2.0 (12), ISC (1), and BSD-3-Clause (1). No dependency is
an environment image, texture pack, HDRI, animation library, UI framework,
physics engine, state framework, or runtime service.
