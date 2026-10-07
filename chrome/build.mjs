// Assembles a Chromium-ready copy of the extension in build/chrome/. Load that
// folder unpacked at chrome://extensions, or zip it for the Chrome Web Store.
import { assemble } from '../packaging/assemble.mjs';
import { OFFSCREEN_FILES, toChromeManifest } from './manifest.mjs';

console.log(`Chromium extension folder written to ${assemble('chrome', toChromeManifest, OFFSCREEN_FILES)}`);
