// Turns the Firefox manifest into one Safari will accept. Pure, so it can be
// tested under Node without a Mac.

/** Permissions Safari has no API for. `theme` is Firefox-only. */
const UNSUPPORTED_PERMISSIONS = new Set(['theme']);

export function toSafariManifest(manifest) {
  const { browser_specific_settings: _firefoxOnly, ...rest } = manifest;
  return {
    ...rest,
    permissions: (manifest.permissions ?? []).filter((p) => !UNSUPPORTED_PERMISSIONS.has(p))
  };
}
