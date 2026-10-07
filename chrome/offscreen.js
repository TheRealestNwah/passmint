// Runs inside the offscreen document Chromium needs for clipboard access (the
// service worker has none). It writes whatever the background asks and answers.
import { MESSAGES } from './src/clipboard.js';
import { writeClipboard } from './src/clipboard-write.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== MESSAGES.offscreenWrite) return false;
  writeClipboard(message.text).then(
    () => sendResponse({ ok: true }),
    (error) => sendResponse({ ok: false, error: String(error) })
  );
  return true; // Answer asynchronously.
});
