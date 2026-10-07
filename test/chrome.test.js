import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { toChromeManifest } from '../chrome/manifest.mjs';

const firefox = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

test('drops Firefox-only settings and the theme permission', () => {
  const chrome = toChromeManifest(firefox);
  assert.equal(chrome.browser_specific_settings, undefined);
  assert.deepEqual(chrome.permissions, ['storage', 'clipboardWrite', 'alarms']);
});

test('runs the background as a module service worker, not event-page scripts', () => {
  const { background } = toChromeManifest(firefox);
  assert.deepEqual(background, { service_worker: 'background.js', type: 'module' });
  assert.ok(existsSync(new URL('../background.js', import.meta.url)));
});

test('uses PNG icons that exist, since Chromium cannot show SVG', () => {
  const chrome = toChromeManifest(firefox);
  const paths = [...Object.values(chrome.icons), ...Object.values(chrome.action.default_icon)];
  for (const path of paths) {
    assert.match(path, /\.png$/);
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} is missing`);
  }
});

test('keeps the rest of the manifest', () => {
  const chrome = toChromeManifest(firefox);
  assert.equal(chrome.version, firefox.version);
  assert.equal(chrome.action.default_popup, firefox.action.default_popup);
  assert.equal(chrome.manifest_version, 3);
});

test('does not mutate the source manifest', () => {
  const before = JSON.stringify(firefox);
  toChromeManifest(firefox);
  assert.equal(JSON.stringify(firefox), before);
});
