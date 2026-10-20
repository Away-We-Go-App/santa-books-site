# Santa Books website

A static website for `thesantabooks.com`, with Privacy, Terms and Support pages.
No dependencies or build step.

## Preview

From this directory, run `python3 -m http.server 4179 --directory public`.
Open <http://localhost:4179>.

## Vercel

Use a dedicated Santa Books project with root directory `.` (the repository root),
framework **Other**, no build command, and output directory `public`.
The checked-in `vercel.json` supplies the build/output settings. Domain connection
and production publication require approval; neither is performed by these files.

## App Store link

The badge is intentionally inactive until the Santa Books listing is available.
Replace its `span` in `public/index.html` with an `a` with the verified store URL,
remove `aria-disabled`, and change its image alt to `Download on the App Store`.
Do not substitute an Away We Go URL or a guessed Apple app ID.

## Assets

- Wordmark: approved outlined heirloom SVG from Santa's native asset catalog.
- Clay tree/reindeer: original `SantaChristmasArt` from Santa's native asset catalog.
- EB Garamond: existing app font, distributed under the included OFL license.
- App Store badge: Apple's English black badge, downloaded from
  <https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83>.

The page uses Santa's cream background and evergreen wordmark ink. All assets
are served locally. There are no analytics, third-party scripts, accounts, or
connections to Away We Go services.


## Information pages

`public/privacy/index.html`, `public/terms/index.html` and
`public/support/index.html` provide the extensionless destinations `/privacy`,
`/terms` and `/support` (the static host may canonicalize their trailing slash).
The homepage footer links to all three. The logo on each information page
returns home. All pages use the same local font, colors and wordmark.

Policy/terms adapt the current Away We Go pages to Santa Books with verified
contact, account/cloud and fulfillment-retention qualifications. See
`docs/legal-publication-review.md` for source/evidence and review/deployment gates.
Changing or publishing policy text requires task-specific authorization.

## Homepage motion

`public/home-motion.js` draws the clay reindeer/tree exchange from two local
WebP assets (about 671 KiB combined). `public/home-leg-rig.mjs` reuses the first
approved pose: its head, scarf and torso remain stable while clipped leg textures
move continuously. Hooves hold their ground position during stance; front/rear
swings overlap in a four-beat walk. The closed-mouth glance and star-led tree bow
retain their original timing. A small, occasional head nod adds movement during
walking and settles when the reindeer stops. Canvas is transparent and spans the viewport.

Travel cruises at 38 CSS pixels per second with two-second starts/stops.
`public/home-walk.mjs` owns the route; viewport width changes the loop duration.
The shorter 56-unit stride and 65% stance fraction are stylized animation choices,
not measured reindeer anatomy. Leg motion still uses continuous texture deformation;
it is not a 3D skeletal rig. See [controlled walk](docs/controlled-walk.md).

Snow spans the homepage viewport behind text and links with no pointer events.
Reduced-motion users receive a still scene and no snowfall. There is no visible
animation control.
Hidden tabs suspend the animation, the offscreen scene skips drawing, and snow
renders at up to 30 fps while the connected leg animation updates at up to 60 fps. An exact first-frame poster uses the same geometry as the canvas, avoiding a
composition/size jump during loading; it is also the no-JavaScript / failed-asset
fallback. Other pages do not load the script.

Asset provenance: tree from the approved clay art; walk poses generated with the
built-in image generation tool using that reindeer as the identity reference.
The approved prototype supplied the pose registration, glance, and tree timing.

Candidate provenance and limitations: [walk candidate](docs/walk-candidate.md).

Verification: `node --test tests/*.test.mjs`,
`node --check public/home-motion.js`, `git diff --check`, and browser
QA at 390 × 844 and 1440 × 1000 (also overflow checks at widths 320 and 768).
For pixel-level regression checks, serve the repository root with
`python3 -m http.server 4186` and open `/tests/rig-render.html`; expect PASS.
It checks connected limbs across 112 poses, a stationary planted hoof, and an
unchanging head texture.

Check delayed-asset loading, reduced motion, blocked WebP fallback, disabled JavaScript,
and the Privacy/Terms/Support links when changing this integration.
