// Turns the Firefox manifest into one Safari will accept. Pure, so it can be
// tested under Node without a Mac.

/** Permissions Safari has no API for. `theme` is Firefox-only. */
const UNSUPPORTED_PERMISSIONS = new Set(['theme']);

/** PNGs rendered by `npm run icons:safari`; see safari/make-icons.mjs. */
export const APP_ICONS = Object.fromEntries(
  [48, 96, 128, 256, 512].map((size) => [size, `icons/png/icon-${size}.png`])
);
export const TOOLBAR_ICONS = Object.fromEntries(
  [19, 38, 57].map((size) => [size, `icons/png/toolbar-${size}.png`])
);

export function toSafariManifest(manifest) {
  const { browser_specific_settings: _firefoxOnly, ...rest } = manifest;
  return {
    ...rest,
    permissions: (manifest.permissions ?? []).filter((p) => !UNSUPPORTED_PERMISSIONS.has(p)),
    icons: APP_ICONS,
    action: { ...manifest.action, default_icon: TOOLBAR_ICONS }
  };
}
