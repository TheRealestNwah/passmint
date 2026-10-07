/**
 * Where the extension is running, for the few features that differ by browser.
 *
 * Takes the runtime API as an argument rather than reading `browser.runtime`,
 * so it can be tested under Node.
 */

function extensionOrigin(runtime) {
  try {
    return String(runtime?.getURL?.('') ?? '');
  } catch {
    return '';
  }
}

/**
 * Safari serves extension pages from safari-web-extension://, which is a more
 * reliable signal than sniffing the user agent.
 */
export function isSafariExtension(runtime) {
  return extensionOrigin(runtime).startsWith('safari-web-extension:');
}

/** Chrome, Edge, Brave and Opera all serve extension pages from chrome-extension://. */
export function isChromiumExtension(runtime) {
  return extensionOrigin(runtime).startsWith('chrome-extension:');
}

/** 'safari', 'chromium', or 'firefox' (also the answer when nothing is known). */
export function browserFamily(runtime) {
  if (isSafariExtension(runtime)) return 'safari';
  if (isChromiumExtension(runtime)) return 'chromium';
  return 'firefox';
}

/**
 * The 30-second clipboard clear runs from an alarm in the background page, with
 * no user gesture behind it. Safari requires a gesture for clipboard writes, and
 * iOS has no equivalent at all, so the clear cannot be relied on there, and the
 * setting is withheld rather than promising something that may not happen.
 * Chromium's service worker has no clipboard, so it writes through an
 * offscreen document instead (see src/clipboard.js).
 */
export function supportsClipboardAutoClear(runtime) {
  return browserFamily(runtime) !== 'safari';
}
