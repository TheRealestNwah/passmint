// Event page for the one job the popup can't do: clearing the clipboard after
// it has closed. It holds no state and wakes only for the popup's message and
// the alarm that follows. See src/clipboard.js for why it works this way.

import { createClipboardClearer } from './src/clipboard.js';

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Fall through to execCommand, which clipboardWrite also allows here.
  }
  // An empty selection copies nothing, so supply the data in the copy event.
  const onCopy = (e) => {
    e.clipboardData.setData('text/plain', text);
    e.preventDefault();
  };
  document.addEventListener('copy', onCopy);
  try {
    document.execCommand('copy');
  } finally {
    document.removeEventListener('copy', onCopy);
  }
}

const clearer = createClipboardClearer({ alarms: browser.alarms, writeClipboard });

browser.runtime.onMessage.addListener(clearer.onMessage);
browser.alarms.onAlarm.addListener(clearer.onAlarm);
