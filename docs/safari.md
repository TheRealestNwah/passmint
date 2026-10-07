# Safari (macOS)

Safari runs the same extension code. Only the manifest differs, and Safari needs
a native wrapper app built in Xcode, so the build needs a Mac. It has been tried
on real Safari and works. It isn't on the App Store yet, so you build it yourself.

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
- Safari has exactly one look, Liquid Glass (`data-style="glass"` in
  `popup/popup.css`): translucent blurred surfaces over a soft gradient, specular
  edges, pill shapes, the system font. `resolveStyle` forces it in Safari and never
  returns it elsewhere, and the style and theme-colour pickers are hidden there.
  Light/dark/system mode still works. The design follows macOS 26's Liquid Glass;
  I don't have specifics for macOS 27, so revisit when it ships. It honours
  Reduce Transparency, and falls back to opaque where `backdrop-filter` is missing.
- Icons are PNGs (`icons/png/`, rendered from the SVGs by `npm run icons:safari`;
  commit the result). The toolbar PNG uses a fixed mid-grey, since `context-fill`
  is Firefox-only.
- The "Clear clipboard after 30s" setting is hidden in Safari (`src/platform.js`).
  The clear runs from an alarm with no user gesture behind it, and Safari
  generally requires one for clipboard writes; iOS has no equivalent. A saved
  setting from elsewhere is ignored there, and copying itself is unaffected.

## Still open

- Whether the auto-clear could work on macOS Safari. It is hidden for now; if it
  turns out to work, flip `supportsClipboardAutoClear` in `src/platform.js`.
- App Store distribution needs a paid Apple Developer account and a proper bundle
  identifier (the converter's default is `com.github.Passmint`).
- iOS isn't built or tested; CI converts and builds the macOS app only.
