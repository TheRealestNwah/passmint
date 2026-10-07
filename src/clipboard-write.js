/**
 * Writes text to the clipboard from a page that has a DOM: the Firefox event
 * page, or the offscreen document Chromium uses (see src/clipboard.js).
 */
export async function writeClipboard(text) {
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
