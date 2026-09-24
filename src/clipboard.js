/**
 * Clipboard auto-clear: wipe the clipboard a while after the Copy button.
 *
 * The popup cannot do this itself. Firefox closes it as soon as focus leaves,
 * usually a second after Copy, and its timers die with it. So the popup sends
 * a message and the background script (background.js) owns the wipe.
 *
 * The wipe is an alarm rather than a setTimeout because the background is an
 * event page: Firefox suspends it after about 30 seconds idle, and a pending
 * timer does not keep it awake. An alarm wakes it back up. Scheduling again
 * replaces the pending alarm, so the countdown restarts from the latest copy.
 *
 * Without the clipboardRead permission, which carries an install-time
 * warning, the wipe cannot check that the clipboard still holds the password.
 * It clears whatever is there at that moment, and the setting says so.
 *
 * Nothing here touches a browser API directly; the alarms API and the
 * clipboard writer are passed in, so the logic runs under Node.
 */

export const CLEAR_ALARM = 'passmint:clear-clipboard';
export const CLEAR_DELAY_MS = 30_000;

export const MESSAGES = Object.freeze({
  schedule: 'passmint:schedule-clear',
  cancel: 'passmint:cancel-clear'
});

/**
 * @param {object} deps
 * @param {{ create(name: string, info: object): unknown, clear(name: string): unknown }} deps.alarms
 * @param {(text: string) => Promise<void>} deps.writeClipboard
 * @param {() => number} [deps.now]
 */
export function createClipboardClearer({ alarms, writeClipboard, now = Date.now }) {
  const clearer = {
    async schedule(delayMs = CLEAR_DELAY_MS) {
      await alarms.create(CLEAR_ALARM, { when: now() + delayMs });
    },

    async cancel() {
      await alarms.clear(CLEAR_ALARM);
    },

    /** Resolves true if this alarm was ours and the clipboard was cleared. */
    async onAlarm(alarm) {
      if (alarm?.name !== CLEAR_ALARM) return false;
      await writeClipboard('');
      return true;
    },

    /**
     * runtime.onMessage handler. Returns a promise for our messages, which
     * keeps the event page alive until the alarm is set, and undefined for
     * anything else so other listeners can answer.
     */
    onMessage(message) {
      if (message?.type === MESSAGES.schedule) return clearer.schedule();
      if (message?.type === MESSAGES.cancel) return clearer.cancel();
      return undefined;
    }
  };
  return clearer;
}
