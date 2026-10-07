# Safari (work in progress)

Safari runs the same extension code. Only the manifest differs, and Safari needs
a native wrapper app built in Xcode, so the last steps need a Mac.

## Build and run locally (Mac)

Requires macOS, Xcode, and Node 18+. A free Apple ID is enough for local use.

```bash
npm install
npm run build:safari
xcrun safari-web-extension-converter build/safari --project-location build/safari-xcode --app-name Passmint --no-open
open build/safari-xcode/Passmint/Passmint.xcodeproj
```

1. In Xcode, pick the macOS scheme, set Signing to your Apple ID team (or
   "Sign to Run Locally"), and press Run.
2. In Safari: Settings > Advanced > "Show features for web developers", then
   Develop > "Allow Unsigned Extensions" (resets each time Safari quits).
3. Safari > Settings > Extensions > enable Passmint.

## What differs from Firefox

- `browser_specific_settings` and the `theme` permission are dropped
  (`safari/manifest.mjs`). The popup already treats `browser.theme` as optional
  and falls back to `prefers-color-scheme`.
- Settings use `storage.local`, as on Firefox.

## Open questions (untested, need a Mac)

- Does the clipboard auto-clear alarm fire reliably under Safari's event-page
  lifecycle, and can the background write the clipboard without focus? It
  probably cannot on iOS.
- Toolbar icons are SVG; Safari may need PNG fallbacks. The Xcode app icon
  definitely needs PNGs.
- App Store distribution needs a paid Apple Developer account.
