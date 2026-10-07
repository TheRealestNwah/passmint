import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  browserFamily,
  isChromiumExtension,
  isSafariExtension,
  supportsClipboardAutoClear
} from '../src/platform.js';

const runtimeAt = (url) => ({ getURL: (path) => url + path });

test('recognises a Safari extension page', () => {
  assert.equal(isSafariExtension(runtimeAt('safari-web-extension://ABC-123/')), true);
});

test('does not mistake other browsers for Safari', () => {
  assert.equal(isSafariExtension(runtimeAt('moz-extension://abc/')), false);
  assert.equal(isSafariExtension(runtimeAt('chrome-extension://abc/')), false);
});

test('copes with a missing or throwing runtime', () => {
  assert.equal(isSafariExtension(undefined), false);
  assert.equal(isSafariExtension({}), false);
  assert.equal(
    isSafariExtension({ getURL: () => { throw new Error('nope'); } }),
    false
  );
});

test('auto-clear is offered everywhere except Safari', () => {
  assert.equal(supportsClipboardAutoClear(runtimeAt('moz-extension://abc/')), true);
  assert.equal(supportsClipboardAutoClear(runtimeAt('safari-web-extension://abc/')), false);
});

test('recognises Chromium browsers by their extension origin', () => {
  assert.equal(isChromiumExtension(runtimeAt('chrome-extension://abc/')), true);
  assert.equal(isChromiumExtension(runtimeAt('moz-extension://abc/')), false);
  assert.equal(isChromiumExtension(runtimeAt('safari-web-extension://abc/')), false);
  assert.equal(isChromiumExtension(undefined), false);
});

test('names the browser family, defaulting to Firefox', () => {
  assert.equal(browserFamily(runtimeAt('chrome-extension://abc/')), 'chromium');
  assert.equal(browserFamily(runtimeAt('safari-web-extension://abc/')), 'safari');
  assert.equal(browserFamily(runtimeAt('moz-extension://abc/')), 'firefox');
  assert.equal(browserFamily(undefined), 'firefox');
});

test('auto-clear is withheld in Chromium until it is built there', () => {
  assert.equal(supportsClipboardAutoClear(runtimeAt('chrome-extension://abc/')), false);
});
