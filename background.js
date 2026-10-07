// Event page (Firefox, Safari) or service worker (Chromium) for the one job
// the popup can't do: clearing the clipboard after it has closed. It holds no
// state and wakes only for the popup's message and the alarm that follows. See
// src/clipboard.js for why it works this way.

import { createClipboardClearer, createOffscreenWriter } from './src/clipboard.js';
import { writeClipboard } from './src/clipboard-write.js';

// Chromium has only `chrome.*` (promise-based in MV3); Firefox and Safari have `browser.*`.
const api = globalThis.browser ?? globalThis.chrome;

// A service worker has no DOM, so Chromium writes through an offscreen document.
const write = api.offscreen ? createOffscreenWriter({ offscreen: api.offscreen, runtime: api.runtime }) : writeClipboard;

const clearer = createClipboardClearer({ alarms: api.alarms, writeClipboard: write });

api.runtime.onMessage.addListener(clearer.onMessage);
api.alarms.onAlarm.addListener(clearer.onAlarm);
