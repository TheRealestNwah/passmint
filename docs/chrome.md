# Chrome, Edge, Brave and Opera

All four are Chromium browsers, so one build covers them.

## Build and load

```bash
npm install
npm run build:chrome
```

- `build/chrome/` is the unpacked extension. Open `chrome://extensions` (or
  `edge://extensions`, `brave://extensions`, `opera://extensions`), turn on
  Developer mode, choose **Load unpacked** and pick that folder.
- `web-ext-artifacts/chrome/passmint-<version>.zip` is the same thing zipped, the
  form the Chrome Web Store, Edge Add-ons and Opera add-ons stores accept.

## What differs from Firefox

- The background is a service worker (`background.js` as a module), not event-page
  `scripts`, and icons are PNGs, since Chromium cannot show SVG (`chrome/manifest.mjs`).
- `browser_specific_settings` and the `theme` permission are dropped. Chromium has
  no theme API.
- `background.js` uses `browser.*` when it exists and `chrome.*` otherwise.
- Each browser gets its own look, detected automatically and changeable in the
  Appearance panel:

  | Look | Auto-chosen for | Notes |
  | --- | --- | --- |
  | Chrome | Chrome and any other Chromium | Material 3 colours, pill shapes |
  | Edge | Edge | Fluent colours, squarer shapes |
  | Brave | Brave (via `navigator.brave`) | Orange deepened so white text stays readable |
  | Opera GX | Opera (the user agent can't tell Opera from GX) | Red, angular, uppercase labels |

  The colours are approximations from each browser's UI, not copies. The palettes
  live in `CHROMIUM_PALETTES` in `src/appearance.js`; after changing one, paste the
  output of `node chrome/gen-tokens.mjs` over the "Chromium palettes" section of
  `popup/popup.css` (a test fails until they agree). Every pairing is checked for
  contrast. Firefox users never see these looks, and Chromium users never see
  Photon or Nova.
- The clipboard auto-clear goes through an offscreen document. A service worker has
  no clipboard access, so when the alarm fires `background.js` opens
  `offscreen.html` (reason `CLIPBOARD`), asks it to write an empty string, and
  closes it again. This adds the `offscreen` permission, which carries no install
  warning. The two offscreen files live in `chrome/` and are copied into the build
  by `chrome/build.mjs`.

## Verification

Checked by loading the built extension into real Microsoft Edge (headless):
the service worker starts, Edge is detected, the chosen look persists across a
reload, and the page logs no errors. The auto-clear was also checked there: a
copied value was gone 30 seconds after the schedule message, and no offscreen
document was left open. Chrome, Brave and Opera haven't been tried.
