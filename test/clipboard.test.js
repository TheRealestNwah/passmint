import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CLEAR_ALARM,
  CLEAR_DELAY_MS,
  MESSAGES,
  createClipboardClearer
} from '../src/clipboard.js';

const MANIFEST = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));

/** Stand-in for browser.alarms: one alarm per name, like the real one. */
function fakeAlarms() {
  const pending = new Map();
  return {
    pending,
    create: (name, info) => {
      pending.set(name, info);
    },
    clear: (name) => pending.delete(name)
  };
}

function setup() {
  const alarms = fakeAlarms();
  const writes = [];
  let clock = 1_000_000;
  const clearer = createClipboardClearer({
    alarms,
    writeClipboard: async (text) => {
      writes.push(text);
    },
    now: () => clock
  });
  return { alarms, writes, clearer, tick: (ms) => (clock += ms) };
}

test('copying schedules a wipe 30 seconds out', async () => {
  const { alarms, clearer } = setup();
  await clearer.onMessage({ type: MESSAGES.schedule });
  assert.equal(CLEAR_DELAY_MS, 30_000);
  assert.deepEqual(alarms.pending.get(CLEAR_ALARM), { when: 1_000_000 + 30_000 });
});

test('copying again restarts the countdown instead of adding a second wipe', async () => {
  const { alarms, clearer, tick } = setup();
  await clearer.onMessage({ type: MESSAGES.schedule });
  tick(20_000);
  await clearer.onMessage({ type: MESSAGES.schedule });
  assert.equal(alarms.pending.size, 1);
  assert.equal(alarms.pending.get(CLEAR_ALARM).when, 1_000_000 + 20_000 + 30_000);
});

test('the alarm clears the clipboard by writing an empty string', async () => {
  const { writes, clearer } = setup();
  assert.equal(await clearer.onAlarm({ name: CLEAR_ALARM }), true);
  assert.deepEqual(writes, ['']);
});

test('other alarms leave the clipboard alone', async () => {
  const { writes, clearer } = setup();
  assert.equal(await clearer.onAlarm({ name: 'something-else' }), false);
  assert.equal(await clearer.onAlarm(undefined), false);
  assert.deepEqual(writes, []);
});

test('turning the setting off cancels a pending wipe', async () => {
  const { alarms, clearer } = setup();
  await clearer.onMessage({ type: MESSAGES.schedule });
  await clearer.onMessage({ type: MESSAGES.cancel });
  assert.equal(alarms.pending.size, 0);
});

test('unrelated messages are not answered, so other listeners still can', () => {
  const { alarms, clearer } = setup();
  assert.equal(clearer.onMessage({ type: 'other' }), undefined);
  assert.equal(clearer.onMessage(null), undefined);
  assert.equal(alarms.pending.size, 0);
});

test('the manifest wires up the background script without clipboardRead', () => {
  assert.deepEqual(MANIFEST.background.scripts, ['background.js']);
  assert.ok(MANIFEST.permissions.includes('alarms'));
  assert.ok(MANIFEST.permissions.includes('clipboardWrite'));
  // clipboardRead would let the wipe check the clipboard first, but it
  // carries an install-time warning.
  assert.ok(!MANIFEST.permissions.includes('clipboardRead'));
});
