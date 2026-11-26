# Source for bundled files

SANOR QUEST uses **one 3D engine: Three.js r187** (MIT, https://github.com/mrdoob/three.js).

| Source | Output | What it is |
|---|---|---|
| `src/sq-three.js` + `src/characters.js` | `shared/sq-three.js` | The shared engine. Bundles Three.js and exposes `window.SQ3`: `createEngine(canvas, options)`, `makeWorldAdapter(scene)`, `createCast(scene)` (Alex, Mum, the player), `stdMat`, `webglAvailable()` |
| `src/table-three.js` | `home/table-three.js` | Alex's Table 3D. Imports Three.js from `shared/sq-three.js` through `src/shim/*` so it is downloaded only once |

Build after editing a file in `src/` or `content/`:

```
npm install
npm run build
```

## How a map uses the engine

Map layouts (`home/world.js`) are written in a small immediate-mode API:
`box`, `cylinder`, `ellipsoid`, `tri`, `mesh`, `draw(mesh, matrix, water)`, `model`.
`SQ3.createEngine()` turns those calls into merged Three.js meshes with lighting, soft shadows,
surface patterns, fog and automatic quality lowering on slow devices.

| Page | Engine |
|---|---|
| `home/index.html` (Map 01) | `SQ3.createEngine` + `home/world.js` |
| `home/table-three.html` | Three.js directly + `SQ3.makeWorldAdapter` + `home/world.js` |

Devices without WebGL are sent to `home/table.html` (the 2D version of Alex's Table).
