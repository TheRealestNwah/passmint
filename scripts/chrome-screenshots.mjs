// Regenerates docs/screenshots/chrome-*.png: the real popup in headless Chromium
// with the extension APIs stubbed and the Chrome look. Run: node scripts/chrome-screenshots.mjs
import { createHarness } from '../test/popup-harness.js';

const CHROME = { extensionUrl: 'chrome-extension://test/', browserName: null };
const KEY = 'passmint:appearance';
import { fileURLToPath } from 'node:url';
const out = (name) => fileURLToPath(new URL(`../docs/screenshots/${name}.png`, import.meta.url));

const harness = await createHarness();
const shots = [
  ['chrome-light', 'light', false],
  ['chrome-dark', 'dark', false],
  ['chrome-passphrase', 'dark', true]
];
for (const [name, mode, passphrase] of shots) {
  const stored = { [KEY]: { style: 'chrome', mode, accent: 'default' } };
  const { page, context } = await harness.openPopup({ ...CHROME, stored, deviceScaleFactor: 2 });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ colorScheme: mode });
  if (passphrase) await page.locator('#tab-passphrase').click();
  await page.waitForTimeout(300);
  const height = await page.evaluate(() => Math.ceil(document.body.getBoundingClientRect().height));
  await page.setViewportSize({ width: 360, height });
  await page.screenshot({ path: out(name) });
  await context.close();
}
await harness.close();
