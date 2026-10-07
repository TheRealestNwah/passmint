import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafariExtension, supportsClipboardAutoClear } from '../src/platform.js';

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
