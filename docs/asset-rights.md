# Asset rights ledger

No distributable third-party asset is accepted until its row contains an
authoritative source, exact version or digest, license or model permission,
redistribution status, required attribution, and verification evidence.

| Asset | Source and version | License or permission | Redistribution | Attribution | Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- |
| VRM character | `vrm-c/vrm-specification` commit `821c11b250d8c70d5804ee13431e42bee56ea9c0`, `VRM1_Constraint_Twist_Sample` v1.0.1 | VRM Public License 1.0; embedded metadata permits everyone, corporate commercial use, redistribution, and modified redistribution | Allowed | Embedded metadata says unnecessary; source is still credited in this repository | SHA-256 `12c2b97e95e700783a6a550dc0eee2d7880aeedccef9ae67bc4c5a2f0f2631a2`; metadata audit recorded in `public/assets/CHARACTER_LICENSE.md` | Accepted |
| Environment textures/HDRI | Procedural shaders and generated geometry only | Repository code license and dependency licenses | No standalone third-party image asset | None | Build source and lockfile | Accepted |
| Audio | No audio is required for the prototype | Not applicable | Not distributed | None | Product specification | Closed |

Code dependencies are recorded by package name, exact lockfile version, and
upstream license after installation.
