# Passmint

Firefox, Safari and Chromium (Chrome, Edge, Brave, Opera) MV3 extension (popup +
small background script) that generates passwords and passphrases. No network access, no telemetry. See README.md for
the user-facing description.

## Commands

```bash
npm install
npm test             # node:test unit tests, no browser (generator, theme, appearance, clipboard)
npm run test:popup   # popup tests in headless Chromium; needs `npx playwright install chromium` once
npm run lint         # web-ext lint
npm run build        # unsigned package into web-ext-artifacts/
npm run build:safari  # Safari-ready folder in build/safari/ (Xcode step needs a Mac)
npm run build:chrome  # Chromium folder in build/chrome/ plus a store zip in web-ext-artifacts/chrome/
npm run check-versions  # manifest.json and package.json versions must match
```

CI (`.github/workflows/ci.yml`, required check "Test and lint") runs all of the
above on every PR.

## Layout

- `src/` — pure ES modules with no `browser.*` calls (generator, theme,
  appearance, clipboard, wordlist), so tests run them directly under Node.
- `popup/` — popup UI; the only code besides `background.js` that touches `browser.*`.
- `background.js` — event page that clears the clipboard via an alarm.
- `test/` — `node:test` suites; `popup-harness.js` stubs the extension APIs for Playwright.
- `safari/` — Safari manifest transform, build script and PNG icon renderer (`npm run build:safari`, `icons:safari`); see docs/safari.md.
- `chrome/` — Chromium manifest transform, build script and the offscreen document (`offscreen.html/js`) that does the clipboard clear, since a service worker has no clipboard; `chrome/gen-tokens.mjs` generates the Chromium palette CSS in `popup/popup.css` from `CHROMIUM_PALETTES` (a test fails if they drift). `packaging/` is the shared build helper. See docs/chrome.md.
- `src/platform.js` detects Safari and Chromium: it forces the Liquid Glass look (`data-style="glass"`); Safari also hides the clipboard auto-clear setting.
- `.github/workflows/` — `ci.yml`, `release.yml` (manual; tags and submits to AMO), `backfill-release.yml`.

## Gotchas

- **Legacy names are load-bearing.** The extension id
  (`passforge@therealestnwah.github.io`) and storage key (`passforge:settings`)
  predate the rename to Passmint. Changing either drops users' settings or
  breaks the AMO listing.
- Bump `version` in both `manifest.json` and `package.json` together.
- Never cut a release or push a tag without the owner's explicit say-so.
- Permissions are `storage`, `clipboardWrite`, `alarms`, `theme`; keep README's
  permission list in step with `manifest.json`.
- README test counts (`npm test`, `test:popup`) go stale; update on change.
- README screenshots live in `docs/screenshots/` (360px popup, real popup
  rendered in headless Firefox/Waterfox with `browser.storage` stubbed).
