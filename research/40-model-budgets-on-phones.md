# 40: How big a 3D model can be on a phone

Track 3 (Assets), 2026-10-11. Why: every model the game uses that is not built
from map data (vehicle bodies, kiosks, signs, landmarks) needs a size limit
before the first one is made. The reference device is a mid-range Android
phone, under about 30 MB before you can drive (D-0006), streamed in 100 m
squares (D-0008).

All figures below were read from the pages listed at the end, on 2026-10-11.
Where we turn them into our own number, it says "derived" and how.

## 1. Triangles and draw calls

The phone has a fixed amount of drawing work per frame. Two things use it up:
how many triangles it draws, and how many separate "draw calls" (one per
mesh-and-material pair) it makes. Draw calls usually run out first on phones.

| Source | What it says |
|---|---|
| Android, "Optimize geometry" [4] | A demo held about **30 fps at ~210,000 triangles per frame**: towers ~3,000 triangles, soldiers ~360, one hero robot 11,000. Keep triangles above about 10 pixels on screen. Each level of detail halves the triangles. One mesh: at most 65,535 vertices (16-bit indices). |
| Unreal Engine mobile guidelines [3] | At most **700 draw calls** and **500,000 triangles per view** (the most that held 30 fps on an iPad 4 / Air). |
| Meta Quest (a phone chip in a headset) [1] | Triangles per frame: Quest 2 **750k–1M**, Quest 3 1.3–1.8M. Draw calls for a busy app on Quest 2: **80–200**. Has to hold 72 fps. |
| Unity mobile [7][8] | Mobile characters **300–1,500 polygons**, two or three materials. Dynamic batching only for meshes under 300 vertices. |
| Decentraland (a browser world streamed in ~16 m plots) [9] | **10,000 triangles per plot**, textures at most 1024×1024. |
| Sketchfab mobile viewer [6] | Under 500,000 polygons and about 50 meshes for a whole scene on a phone. |
| Meshy's own low-poly guide [M] | Phone game assets under about 10,000 faces, under 5,000 for casual games. |
| Bruno Simon's 2025 browser portfolio [11] | Leans on instancing (one draw call for many copies of the same tree or bench) and one palette texture so merged models can still differ in colour. |

**Derived for us** (from the Android demo at 30 fps and Quest 2's lower bound,
both phone-class chips): plan for about **300,000 triangles and about 150 draw
calls per frame** for everything on screen, world included. That is a working
target until World look measures the real phone, not a fixed rule.

## 2. Textures (the pictures wrapped on a model)

- A texture's memory on the graphics chip is width × height × 4 bytes, plus a
  third for its smaller copies (mipmaps) [13][14]: 2048² ≈ 22 MB, 1024² ≈ 5.6
  MB, 512² ≈ 1.4 MB (derived from that formula). The phone may have only a few
  hundred MB for the whole game, so big textures run out fast.
- Graphics-chip formats (KTX2 holding Basis Universal) cut that 4–8 times and
  stay small on the graphics chip, unlike JPEG or PNG which are unpacked to
  full size [13][16]. **ETC1S** mode: files about JPEG size, best for flat
  colour and stylised art; **UASTC**: bigger, better for normal maps [15][16].
  three.js reads both (`KTX2Loader`) [18]. Licence: Apache 2.0 [15].
- Android: rough/metal maps at half the colour map's size; far-away models get
  small textures (256² in its example) [14].
- **One shared palette texture**: every model's faces point at colour squares
  in one tiny image, so a hundred props can share one material and one draw
  call (Imphenzia PixPal, Bruno Simon) [11][P]. Cheapest option there is, and
  it forces every model into the same colours, which also helps the style hold
  together (see research/41).

## 3. File format

- **glTF / GLB**, in metres, +Y up, front facing +Z (glTF 2.0 spec §3.4) [S].
- Two ways to squeeze the shape data:
  - **Draco** (Apache 2.0): smallest files, but slow to unpack, and its
    decoder download outweighs the saving for files under about 1 MB [19][20].
  - **meshopt** (`EXT_meshopt_compression`, MIT): slightly bigger files, but
    unpacks "considerably faster" (about 1 GB/s in the browser), also packs
    animation and instances, and is meant to be followed by gzip/brotli, which
    Cloudflare does for us [21][22].
  - **Quantization** (`KHR_mesh_quantization`): stores positions as small
    whole numbers; Android measured vertex data falling from 48 to 16 bytes
    [26]. Fine for props (each is small and near its own origin).
- three.js's `GLTFLoader` reads Draco, meshopt, quantization, KTX2 and GPU
  instancing; it does **not** read `MSFT_lod`, so levels of detail are done
  with three.js's own `LOD` object [27].

**Choice (common sense, orchestrator):** GLB with meshopt + quantization, KTX2
textures (ETC1S for colour). Many small props streamed in squares is exactly
the case meshopt is built for; Draco only pays off on large single files.

## 4. Tools to cut a model down

| Tool | Licence | Use |
|---|---|---|
| glTF-Transform (library and command line) [28][29][30] | MIT | weld, simplify (built on meshoptimizer), resize textures, KTX2, meshopt, instancing; scriptable from our own Node tools |
| meshoptimizer / gltfpack [21][25] | MIT | the simplifier underneath; keeps seams, borders and outline; error measured as a fraction of the model's size |
| Blender Decimate [31] | GPL program (we only run it, never copy its code) | manual fallback; Planar mode suits boxy kiosks and signs |

We use glTF-Transform from a Node script (MIT, a dependency, techniques and API
only), so the pipeline runs in the cloud with no Blender needed.

## Not found / not checked

- No official per-model triangle counts for big mobile open-world games
  (PUBG Mobile, Genshin, Asphalt); only forum posts, not used.
- No head-to-head test of how well each simplifier keeps a car's outline.
- Our own phone has not been measured yet; the derived frame target above is
  replaced when World look or Platform measures it.

## Sources

1. https://developers.meta.com/horizon/documentation/unity/unity-perf/
3. https://dev.epicgames.com/documentation/en-us/unreal-engine/performance-guidelines-for-mobile-devices-in-unreal-engine
4. https://developer.android.com/games/optimize/geometry
6. https://help.sketchfab.com/en/articles/16152043
7. https://docs.unity.cn/2018.1/Documentation/Manual/ModelingOptimizedCharacters.html
8. https://unity.com/blog/games/optimize-your-mobile-game-performance-expert-tips-on-graphics-and-assets
9. https://docs.decentraland.org/creator/development-guide/sdk7/scene-limitations/
11. https://www.awwwards.com/brunos-portfolio-case-study.html
13. https://www.donmccurdy.com/2024/02/11/web-texture-formats/
14. https://developer.android.com/games/optimize/textures
15. https://github.com/BinomialLLC/basis_universal
16. https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md
18. https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/KTX2Loader.js
19. https://github.com/google/draco
20. https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression
21. https://github.com/zeux/meshoptimizer
22. https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md
25. https://meshoptimizer.org/gltf/
26. https://developer.android.com/games/optimize/vertex-data-management
27. https://threejs.org/docs/pages/GLTFLoader.html
28. https://github.com/donmccurdy/glTF-Transform
29. https://gltf-transform.dev/cli
30. https://gltf-transform.dev/modules/functions/functions/simplify
31. https://docs.blender.org/manual/en/2.82/modeling/modifiers/generate/decimate.html
M. https://www.meshy.ai/tutorials/make-low-poly-3d-models
P. https://forum.babylonjs.com/t/imphenzia-pixpal-palette-texture-pbr-node-material-example-updated-to-version-1-2/56066
S. https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
