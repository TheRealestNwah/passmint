/**
 * Appearance: which look the popup wears, and whether it is light or dark.
 *
 * Style
 *   photon  Firefox's look. In system mode it adopts the active browser
 *           theme's colours through src/theme.js.
 *   nova    Waterfox's Nova look: rounder shapes, its own palette, and one of
 *           Waterfox's twelve theme colours as the accent. It follows the
 *           browser's light/dark state but not a theme's individual colours,
 *           since Nova is a complete palette in its own right.
 *   auto    nova in Waterfox, photon everywhere else.
 *   chrome, edge, brave, gx
 *           Chromium-family looks (Chrome, Edge, Brave, Opera GX). Offered, and
 *           auto-detected, only in Chromium browsers, where the Firefox looks
 *           are not offered. They use the CHROMIUM_PALETTES table below.
 *   glass   Liquid Glass, for Safari only. It is not a preference: Safari
 *           always gets it and no other browser ever does, so it has no entry
 *           in STYLE_PREFS and the style picker is hidden there.
 *
 * Mode
 *   system  follow the browser theme, then prefers-color-scheme.
 *   light / dark  forced, whatever the browser or OS says.
 *
 * Nothing here calls a browser API except detectBrowserName, so the rest is
 * testable under Node.
 */

import { applyTheme, deriveTokens, normalizeColor, mix, toCss } from './theme.js';

export const FIREFOX_STYLE_IDS = Object.freeze(['photon', 'nova']);
export const CHROMIUM_STYLE_IDS = Object.freeze(['chrome', 'edge', 'brave', 'gx']);
export const STYLE_PREFS = Object.freeze(['auto', ...FIREFOX_STYLE_IDS, ...CHROMIUM_STYLE_IDS]);

/** Names shown in the Appearance panel. */
export const STYLE_NAMES = Object.freeze({
  photon: 'Firefox',
  nova: 'Waterfox',
  chrome: 'Chrome',
  edge: 'Edge',
  brave: 'Brave',
  gx: 'Opera GX',
  glass: 'Liquid Glass'
});
export const MODE_PREFS = Object.freeze(['system', 'light', 'dark']);
export const APPEARANCE_DEFAULTS = Object.freeze({ style: 'auto', mode: 'system', accent: 'default' });

/** localStorage key for the last painted state; popup/boot.js reads it too. */
export const SNAPSHOT_KEY = 'passmint:appearance-snapshot';

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const BLACK = { r: 0, g: 0, b: 0, a: 1 };

/** Text drawn on an accent fill in each mode. */
export const ACCENT_TEXT = Object.freeze({ dark: '#15141a', light: '#ffffff' });

/** Nova's surfaces. popup.css must agree; a test holds the two together. */
export const NOVA_SURFACES = Object.freeze({
  light: { bg: '#f7f7fa', sunken: '#efeff4', raised: '#ffffff' },
  dark: { bg: '#1f1e25', sunken: '#17161c', raised: '#2b2a33' }
});

/**
 * Chromium-family palettes. popup.css must agree (a test holds the two
 * together) and every text/accent pairing is checked for contrast. Each browser
 * has a light and a dark set; popup.css derives hover and pressed states from
 * these with color-mix.
 *
 * Brave's orange is deepened to keep white text on it legible, and Opera GX is
 * dark-first with Opera's red.
 */
export const CHROMIUM_PALETTES = Object.freeze({
  chrome: {
    light: { bg: '#ffffff', sunken: '#f0f4f9', raised: '#ffffff', border: '#c4c7c5', borderStrong: '#747775', text: '#1f1f1f', muted: '#444746', accent: '#0b57d0', accentText: '#ffffff' },
    dark: { bg: '#1f1f1f', sunken: '#131314', raised: '#2d2f31', border: '#444746', borderStrong: '#8e918f', text: '#e3e3e3', muted: '#c4c7c5', accent: '#a8c7fa', accentText: '#062e6f' }
  },
  edge: {
    light: { bg: '#ffffff', sunken: '#f5f5f5', raised: '#ffffff', border: '#e0e0e0', borderStrong: '#8a8a8a', text: '#242424', muted: '#616161', accent: '#0f6cbd', accentText: '#ffffff' },
    dark: { bg: '#292929', sunken: '#1f1f1f', raised: '#3d3d3d', border: '#525252', borderStrong: '#9e9e9e', text: '#ffffff', muted: '#d6d6d6', accent: '#479ef5', accentText: '#0a1c33' }
  },
  brave: {
    light: { bg: '#ffffff', sunken: '#f3f4f7', raised: '#ffffff', border: '#dfe1e8', borderStrong: '#8a8e9b', text: '#1d1f25', muted: '#5a5e6a', accent: '#c7380f', accentText: '#ffffff' },
    dark: { bg: '#17171f', sunken: '#101016', raised: '#23232d', border: '#34343f', borderStrong: '#7a7d8c', text: '#f2f2f5', muted: '#b4b6c0', accent: '#ff7a59', accentText: '#1b0f0b' }
  },
  gx: {
    light: { bg: '#f6f3f5', sunken: '#ece8eb', raised: '#ffffff', border: '#d9d3d8', borderStrong: '#8c8590', text: '#14141b', muted: '#575560', accent: '#c8102e', accentText: '#ffffff' },
    dark: { bg: '#0e0e12', sunken: '#08080b', raised: '#1a1a22', border: '#2c2c38', borderStrong: '#6a6876', text: '#f4f2f5', muted: '#b0aeb8', accent: '#fa1e4e', accentText: '#14141b' }
  }
});

/*
 * Waterfox's theme colours, in the order its settings page lists them. Dark
 * mode uses the pastel Waterfox shows on its swatches, with dark text. A
 * pastel has almost no contrast against a light popup, though — a checkbox or
 * focus ring drawn in it all but disappears — so light mode uses a deeper
 * shade of the same hue with white text.
 */
export const ACCENTS = Object.freeze([
  { id: 'default', name: 'Default', dark: '#b9d9f7', light: '#0060df' },
  { id: 'smoke', name: 'Smoke', dark: '#e8e1d5', light: '#6b5f4f' },
  { id: 'ash', name: 'Ash', dark: '#dfe2ef', light: '#555b70' },
  { id: 'sun', name: 'Sun', dark: '#ffe07a', light: '#8a6a00' },
  { id: 'spark', name: 'Spark', dark: '#ffb68a', light: '#b5470f' },
  { id: 'flame', name: 'Flame', dark: '#ffabb6', light: '#c42b3c' },
  { id: 'flare', name: 'Flare', dark: '#ff9ed2', light: '#b8246e' },
  { id: 'lavender', name: 'Lavender', dark: '#dbaaff', light: '#8a3ad6' },
  { id: 'dusk', name: 'Dusk', dark: '#c5b6ff', light: '#5b45c9' },
  { id: 'lagoon', name: 'Lagoon', dark: '#8fc8ff', light: '#0a6ebd' },
  { id: 'tide', name: 'Tide', dark: '#9fe3e6', light: '#0b7a80' },
  { id: 'pine', name: 'Pine', dark: '#a6e8bf', light: '#1d7a45' }
]);

/** Stored preferences can be stale or hand-edited; keep only valid values. */
export function sanitizePrefs(stored) {
  const merged = { ...APPEARANCE_DEFAULTS, ...(stored && typeof stored === 'object' ? stored : {}) };
  return {
    style: STYLE_PREFS.includes(merged.style) ? merged.style : APPEARANCE_DEFAULTS.style,
    mode: MODE_PREFS.includes(merged.mode) ? merged.mode : APPEARANCE_DEFAULTS.mode,
    accent: ACCENTS.some((a) => a.id === merged.accent) ? merged.accent : APPEARANCE_DEFAULTS.accent
  };
}

export function isWaterfox(browserName) {
  return /waterfox/i.test(browserName ?? '');
}

/** Which Chromium look a browser name calls for. Opera maps to GX. */
export function chromiumStyleFor(browserName) {
  const name = browserName ?? '';
  if (/edge|edg\b/i.test(name)) return 'edge';
  if (/brave/i.test(name)) return 'brave';
  if (/opera|opr/i.test(name)) return 'gx';
  return 'chrome';
}

/**
 * Turn the user's style preference into the style actually painted. `family`
 * is 'firefox', 'chromium' or 'safari' (src/platform.js). Each family only
 * ever paints its own looks: a preference from another family falls back to
 * auto, and Safari always gets glass.
 */
export function resolveStyle(pref, browserName, family = 'firefox') {
  if (family === 'safari') return 'glass';
  if (family === 'chromium') {
    return CHROMIUM_STYLE_IDS.includes(pref) ? pref : chromiumStyleFor(browserName);
  }
  if (FIREFOX_STYLE_IDS.includes(pref)) return pref;
  return isWaterfox(browserName) ? 'nova' : 'photon';
}

/**
 * The custom properties popup.css reads for Nova's accent, for both modes at
 * once so the stylesheet can switch between them without asking JavaScript.
 */
export function accentTokens(id) {
  const accent = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  const tokens = {};
  for (const [mode, suffix, toward, hover, active] of [
    ['dark', 'd', WHITE, 0.25, 0.45],
    ['light', 'l', BLACK, 0.15, 0.3]
  ]) {
    const fill = normalizeColor(accent[mode]);
    tokens[`--nova-accent-${suffix}`] = toCss(fill);
    tokens[`--nova-accent-hover-${suffix}`] = toCss(mix(fill, toward, hover));
    tokens[`--nova-accent-active-${suffix}`] = toCss(mix(fill, toward, active));
    tokens[`--nova-accent-text-${suffix}`] = toCss(normalizeColor(ACCENT_TEXT[mode]));
    tokens[`--nova-focus-${suffix}`] = toCss(fill);
  }
  return tokens;
}

/**
 * Paint `root` for a resolved style, a mode preference and an accent, given
 * the current browser theme (or null).
 */
export function applyAppearance(root, { style, mode, accent }, theme) {
  // Start clean, so nothing from a previous style, mode or theme survives.
  root.style.cssText = '';
  root.dataset.style = style;

  if (mode === 'light' || mode === 'dark') {
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
  } else if (style === 'photon') {
    applyTheme(root, theme);
  } else {
    // Nova keeps its own colours and borrows only light-or-dark from the theme.
    const derived = deriveTokens(theme?.colors);
    if (derived) {
      const resolved = derived.dark ? 'dark' : 'light';
      root.dataset.theme = resolved;
      root.style.colorScheme = resolved;
    } else {
      root.removeAttribute('data-theme');
    }
  }

  if (style === 'nova') {
    for (const [name, value] of Object.entries(accentTokens(accent))) {
      root.style.setProperty(name, value);
    }
  }
}

/** What popup/boot.js needs to repaint this state before the popup renders. */
export function takeSnapshot(root) {
  return {
    style: root.dataset.style ?? null,
    theme: root.dataset.theme ?? null,
    css: root.style.cssText
  };
}

/**
 * The browser's own name. runtime.getBrowserInfo is Firefox-family only and
 * needs no permission; Waterfox reports "Waterfox" there. The user agent is a
 * weak fallback, since Waterfox mostly presents as Firefox. In Chromium
 * browsers only the user agent (and navigator.brave) can tell them apart.
 */
export async function detectBrowserName() {
  try {
    const info = await globalThis.browser?.runtime?.getBrowserInfo?.();
    if (info?.name) return info.name;
  } catch {
    /* fall through */
  }
  const ua = globalThis.navigator?.userAgent ?? '';
  if (/waterfox/i.test(ua)) return 'Waterfox';
  // Chromium family: Edge and Opera say so in the user agent, Brave only
  // through navigator.brave, and everything else Chromium is Chrome.
  if (/\bEdg\//.test(ua)) return 'Edge';
  if (/\bOPR\//.test(ua)) return 'Opera';
  try {
    if (await globalThis.navigator?.brave?.isBrave?.()) return 'Brave';
  } catch {
    /* fall through */
  }
  return /\bChrome\//.test(ua) ? 'Chrome' : '';
}
