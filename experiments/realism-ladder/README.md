# Realism ladder (experiment, 2026-10-12)

A test page: Babatunde Ladega Street (800 m of baked Omole roads, the 4 mapped
buildings, stand-in houses along every road) at three quality levels, timed on
the device that opens it. The page is built from `ladder.template.html` by
inserting the map slice (places/omole chunks within 400 m) and the five World
Drive cars, cut to 512 px WebP textures and meshopt shapes (~140 KB each, from
~800 KB) with glTF-Transform (MIT).

Levels (our choices, to be judged by the owner's phone results):
- Low: Lambert light, no shadows, 1x pixels, 8 cars, fog 200 m.
- Medium: sky lighting, 1024 sun shadows, ACES, 1.5x pixels, 260 trees, garden walls, 24 cars.
- High: 2048 soft shadows, GTAO, light bloom, 4x MSAA, 2x pixels, 600 trees, 48 cars, 650 m view.

Cars and trees are instanced (one draw call per car part / tree part, whatever the count).
