// Turns the Firefox manifest into one Chromium browsers (Chrome, Edge, Brave,
// Opera) accept. Pure, so it can be tested under Node.
import { APP_ICONS, TOOLBAR_ICONS } from '../safari/manifest.mjs';

/** Permissions Chromium has no API for. `theme` is Firefox-only. */
const UNSUPPORTED_PERMISSIONS = new Set(['theme']);

export function toChromeManifest(manifest) {
  const { browser_specific_settings: _firefoxOnly, ...rest } = manifest;
  return {
    ...rest,
    minimum_chrome_version: '116',
    permissions: (manifest.permissions ?? []).filter((p) => !UNSUPPORTED_PERMISSIONS.has(p)),
    // Chromium runs the background as a service worker and has no event-page
    // `scripts`; it also cannot show SVG icons, so it takes the PNGs.
    background: { service_worker: manifest.background.scripts[0], type: 'module' },
    icons: APP_ICONS,
    action: { ...manifest.action, default_icon: TOOLBAR_ICONS }
  };
}
