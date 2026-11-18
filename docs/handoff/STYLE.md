# NYC Algos – style guide

## Look
Sunny New York in pixel art, inspired by tile mosaics (not copying any specific mural). No purple, no decorative gradients.

- Page: `#eef2f5` with a faint 16px tile-grout grid (`#e2e8ed`, 1px lines)
- Panels: white, 4px "notched" pixel border made with box-shadow (`#b8c2cc` / `#d3dae1`)
- Text: `#1f2328`, muted `#3d444d` / `#59626e`
- Link and label blue: `#1f5fa6` (hover `#174a82`)
- Accent (buttons, badges, chips): sign yellow `#f5c400`, black text, `0 4px 0 #1c1c1c` drop
- Header: black sign block `#1c1c1c` with white pixel type; 4px black rule

## Type
- Headings: Pixelify Sans 700
- Labels, buttons, nav: Silkscreen, uppercase
- Body: Inter. Never pixel fonts for paragraphs.

## Copy
All prose is written by the owner. Mockups use `[PLACEHOLDERS]`; never invent copy.
Bird chatter and tour-guide hints come from owner-edited lists.

## Rendering
- Logical resolution 320×180. Canvas backing store is 4× (1280×720) with `setTransform(4,…)` and smoothing off, so slow things (clouds) can move in quarter-pixel steps while everything else snaps to whole pixels.
- Sprites never rotate: 3 flap frames × 5 shear angles × left/right.
  - Starling 7×4, plumage by season (spring glossy + light spots + yellow bill; summer glossy, no spots; fall/winter heavy spots, dark bill)
  - Pigeon 9×6 (unchanged by season)
- People are tiny (3×6, kids 3×4). Character comes from animation, not detail.
- Two people play catch: baseball (spring/summer), football with a spiral and higher arc (fall/winter). The catcher raises a glove; about 12% of throws are dropped and picked up.
- Glows are soft radial sprites (cached per color/radius), never rectangles. Glows only appear with darkness (scaled by `nightAmt`).
- Mosaic sky: each pixel picks from a small blue palette by height plus random jitter.

## Scene (Central Park, looking south)
- Layers back to front: sky → clouds (6 depths, parallax) → fireworks → far skyline (Plaza Hotel, One Times Square, Empire State Building) → live lights (ESB tiers, Times Square billboards, ball drop) → near skyline + trees + lake + lawn → lake reflection → skaters behind the bridge → Bow Bridge → bridge reflection → boats, shore props, holiday props → people → birds → flakes → falcon/hawk → speech bubbles.
- Birds are drawn before the lake reflection so they appear in the water.
- Lake reflection: mirror rows of the frame itself into the lake, foreshortened ×3.2, with a per-row sine ripple. Bridge reflects separately (1:1, axis at its footings). Frozen lake = faint, no ripple.
- Day/night and seasons cross-fade (≈4 s and 2.5 s). Holidays cross-fade (≈3 s). Nothing pops.
- Foliage is per-pixel and continuous: every canopy pixel has its own thresholds, so leaves bud in spring (cherry trees bloom pink first), deepen into summer, turn yellow/orange/red and drop one by one in fall (some become falling leaves), and stay bare with snow in winter. Petals and leaves drift from the trees and settle on the lawn; only snow falls from the sky.
- People never appear or vanish: everyone walks in and out along the path. Rowers and skaters walk to the dock, board or step onto the ice, and come back the same way. People also cross Bow Bridge.
- Crowds follow the time of day: joggers early, busiest midday, couples toward evening, a few stragglers at night. Performers, boats, the tour and the kids come out after morning and leave before dark.
- The snowman melts in early spring (sinks, hat drops, carrot falls in the puddle, puddle dries).

## Calendar (auto-cycles; no user selectors)
Each holiday = one day (~28 s) + one night (~14 s). Three per season:
- Winter: Christmas, New Year (ball drop + fireworks), Valentine's (couples, proposals)
- Spring: St. Patrick's, Blossoms, Easter
- Summer: Pride, July 4th (fireworks), Heat wave (open hydrant)
- Fall: Marathon (runners, finish banner), Halloween (costumes, jack-o-lanterns), Thanksgiving (balloons)
ESB lighting colors are stylized, not the real schedule.
