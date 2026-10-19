# Santa Books website

A single static page for `thesantabooks.com`. No dependencies or build step.

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
