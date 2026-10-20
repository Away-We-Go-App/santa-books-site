# Controlled reindeer walk

The generated whole-body atlas changed leg shapes between frames. The renderer
now uses one approved pose and continuous leg movement, preserving the face,
antlers, scarf, clay texture, and tree exchange. No new images were generated.

## Movement reference

Li et al., *Forelimb joints contribute to locomotor performance in reindeer*
(PeerJ, 2020), distinguishes a four-beat walk (left hind, left fore, right hind,
right fore; at least two supporting limbs) from a trot with synchronized diagonal
pairs. [Primary source](https://pmc.ncbi.nlm.nih.gov/articles/PMC7666566/).

The animation follows that walking order. A 65% stance fraction permits overlapping
front/hind swings, replacing the overly restrictive one-airborne-hoof rule. The
56-unit stride reduces reach. These numerical settings are artistic choices for
this short-legged clay character, not measurements from the paper.

While a hoof is planted, its local backward movement exactly cancels the body's
forward travel. Smooth swing curves match contact velocity at both ends. Lift
settles as travel slows, so all feet rest on the ground during the greeting.

A gentle head nod uses the existing neck pivot during a 2.4-second window every
seven seconds. Its smooth envelope and travel-speed weighting settle it at stops;
it fades out during the tree glance. The leg cycle is unchanged.

## Rendering and limits

Runtime canvas masks isolate the torso and reusable leg textures from the first
362px atlas cell. Short texture strips bend connected limbs under the overlapping
torso. This preserves continuity without the visible gaps introduced by cutting
the clay artwork into independently rotating knees. Hooves translate flat.

This is a stylized continuous deformation, not an anatomical 3D rig. The shorter
reach reduces the elastic appearance; visual acceptance still matters alongside
numeric contact tests. The previous atlas remains available for source provenance.

## Verification

- `node --test tests/*.test.mjs`: contact position, support/overlap, smooth cycle
  boundaries, stopped pose, route speed and resize continuity.
- Serve the repository root and open `tests/rig-render.html`: 112 rendered poses
  must keep all lower-leg pixels connected to the body; a visible planted hoof
  must remain pixel-identical within antialiasing tolerance while the body moves;
  the head texture must remain unchanged throughout walking.
- Check the actual homepage at mobile/desktop sizes, including the greeting,
  full exit/re-entry, reduced motion, delayed loading, failed assets and no JS.

Production publication remains a separate approval from this visual preview.
