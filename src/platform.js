/**
 * Where the extension is running, for the few features that differ by browser.
 *
 * Takes the runtime API as an argument rather than reading `browser.runtime`,
 * so it can be tested under Node.
 */

/**
 * Safari serves extension pages from safari-web-extension://, which is a more
 * reliable signal than sniffing the user agent.
 */
export function isSafariExtension(runtime) {
  try {
    return String(runtime?.getURL?.('') ?? '').startsWith('safari-web-extension:');
  } catch {
    return false;
  }
}

/**
 * The 30-second clipboard clear runs from an alarm in the background page, with
 * no user gesture behind it. Safari requires a gesture for clipboard writes, and
 * iOS has no equivalent at all, so the clear cannot be relied on there and the
 * setting is withheld rather than promising something that may not happen.
 */
export function supportsClipboardAutoClear(runtime) {
  return !isSafariExtension(runtime);
}
