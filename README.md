# Santa Books website

A static website for `thesantabooks.com`, with Privacy, Terms, Support and guest photo requests.
The site has no package dependencies. Its build writes the public Santa relay addresses used by invitations.

## Preview

From this directory, run `python3 -m http.server 4179 --directory public`.
Open <http://localhost:4179>.

## Vercel

Use a dedicated Santa Books project with root directory `.` (the repository root),
framework **Other**, build command `node scripts/build-photo-config.mjs`, and output directory `public`.
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

## Guest photo requests

The Santa Books app shares `/photos/#production/<token>` or `/photos/#staging/<token>`. The fragment stays in the browser. Link previews fetch generic Christmas artwork. The guest can choose photos in a mobile browser, review their selection, and send JPEG copies for temporary pickup.

Set `SANTA_PHOTO_PROJECT_PRODUCTION` or `SANTA_PHOTO_PROJECT_STAGING` to the respective Santa Supabase **public project reference** in the website build environment, then build. Missing environments disable only their invitations. Do not put API keys or service credentials in these variables. The browser contacts only the relay selected in the built configuration. It never takes a destination URL from a guest link. Guest photos go directly to the Santa transfer service. The website host does not receive the uploads.

The guest page initially shows six thumbnails. Pending selections stay in memory for retry. The page releases them when the batch finishes or the request closes. The browser decodes supported still images, preserves aspect ratio and orientation, strips embedded metadata including location, and sends a JPEG up to 5,200 pixels on the long edge. For a trusted JPEG, it carries forward only the original capture date in a fresh date-only tag. For a format the phone cannot open, the guest can choose a JPEG or PNG copy. A retry reuses the same submission ID and bytes. Rate-limited uploads automatically resume at most twice for the current photo after the relay’s `Retry-After` delay. A successful upload resets that limit for the next photo. The receipt distinguishes acknowledged uploads from photos that still need attention and shows the pickup deadline returned by the relay. Deploy the Santa app backend and verify cleanup before enabling a website environment.


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

For the guest regression check, install Playwright and its Chromium and WebKit browsers outside the static publication directory. With that installation on Node's module resolution path, run `node --test tests/photo-request.browser.cjs`. Set `CHROME_CHANNEL=chrome` to use an installed Google Chrome. The test starts its own loopback server and substitutes the transfer endpoint.

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
