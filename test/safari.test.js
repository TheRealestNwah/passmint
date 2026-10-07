import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { toSafariManifest } from '../safari/manifest.mjs';

const firefox = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

test('drops Firefox-only settings and the theme permission', () => {
  const safari = toSafariManifest(firefox);
  assert.equal(safari.browser_specific_settings, undefined);
  assert.ok(!safari.permissions.includes('theme'));
});

test('keeps everything else, including the other permissions', () => {
  const safari = toSafariManifest(firefox);
  assert.deepEqual(safari.permissions, ['storage', 'clipboardWrite', 'alarms']);
  assert.equal(safari.version, firefox.version);
  assert.equal(safari.action.default_popup, firefox.action.default_popup);
  assert.equal(safari.action.default_title, firefox.action.default_title);
  assert.deepEqual(safari.background, firefox.background);
});

test('does not mutate the source manifest', () => {
  const before = JSON.stringify(firefox);
  toSafariManifest(firefox);
  assert.equal(JSON.stringify(firefox), before);
});

test('points every icon at a PNG that exists', () => {
  const safari = toSafariManifest(firefox);
  const paths = [...Object.values(safari.icons), ...Object.values(safari.action.default_icon)];
  for (const path of paths) {
    assert.match(path, /\.png$/);
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} is missing`);
  }
});
