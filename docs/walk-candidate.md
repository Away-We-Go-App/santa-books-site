# Grounded walk candidate

This branch is a visual candidate for comparison with production at `407afe6`.
It must be reviewed before merging; creating the preview does not publish it to
the production domain.

The built-in `image_gen.imagegen` tool generated one transparent 4 × 3 atlas
using the approved clay reindeer master as its identity reference. The PNG was
converted to WebP at quality 92. All twelve cells retain one shared scale;
measured eye and floor anchors correct translation drift in the generated grid.
The runtime advances poses by distance and cruises at 38 CSS pixels/second.
The five-second greeting retains the closed-mouth glance and the tree's bow.

This improves registration and speed consistency but is not a rigged animation
with exact planted-foot constraints. Residual pose variation and foot sliding
remain visual review criteria. The previous atlas stays available for comparison.

## Generation prompt

Use case: identity-preserve.
Asset: production replacement-animation atlas for the EXACT clay reindeer in the reference, 12 frames in an exact 4-column by 3-row grid, read left-to-right then top-to-bottom. Real transparent alpha background, no scenery, no labels, no floor, no cast shadows. Fixed camera facing the reindeer's left side in the SAME right-facing three-quarter view as the reference. Equal cells and scale, every cell includes the whole character with padding.

Task: a slow grounded FOUR-BEAT WALK IN PLACE, one complete looping gait. This is one physical stop-motion puppet repositioned 12 times. Give real sequential weight-bearing poses, not 12 arbitrary standing variants. At least two hooves always bear weight; only one leg swings clear at a time. Plant hooves FLAT. Stance legs gradually sweep backward relative to the body; swinging leg bends at knee, clears the ground, reaches forward, then plants. Near foreleg at frame1 is forward planted; frames2-4 move that planted hoof backward; frame5 heel lift; frame6 bent passing; frame7 next contact. Repeat with opposing legs across frames7-12. Hind feet follow in four-beat order rather than synchronous hopping. Small body rise/fall at most 1% of character height. Keep the torso looking solid and weight supported, not rubbery limbs or walking on tips. End pose leads smoothly into frame1.

LOCK IDENTITY: identical antler branch count and silhouette in ALL twelve frames; identical eyes, nose, CLOSED small smile (NO mouth opening, NO expression changes, NO blinking); identical head size/shape; identical round plump belly, short legs, ears and tail. Same bright red knitted scarf with same two ends, length and knot. Same warm tan fine porous clay, brown antlers and hooves, cream inner ears. Lighting upper-left remains absolutely fixed. The HEAD AND ANTLERS are nearly identical across all frames; most motion is below the scarf. Do not turn to profile, do not change face angle, do not redesign the character. No texture flicker, cracks, fur, or shiny plastic. Prioritize matching the approved character and anatomically coherent foot contacts.
