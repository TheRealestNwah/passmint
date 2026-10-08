// Regenerates docs/screenshots/{chrome,edge,brave,opera-gx}-*.png: the real popup in
// headless Chromium with the extension APIs stubbed and each Chromium look. Run: node scripts/chrome-screenshots.mjs
import { createHarness } from '../test/popup-harness.js';

const CHROME = { extensionUrl: 'chrome-extension://test/', browserName: null };
const KEY = 'passmint:appearance';
import { fileURLToPath } from 'node:url';
const out = (name) => fileURLToPath(new URL(`../docs/screenshots/${name}.png`, import.meta.url));

const harness = await createHarness();
const shots = [
  ['chrome-light', 'chrome', 'light', false],
  ['chrome-dark', 'chrome', 'dark', false],
  ['chrome-passphrase', 'chrome', 'dark', true],
  ['edge-light', 'edge', 'light', false],
  ['edge-dark', 'edge', 'dark', false],
  ['brave-light', 'brave', 'light', false],
  ['brave-dark', 'brave', 'dark', false],
  ['opera-gx-light', 'gx', 'light', false],
  ['opera-gx-dark', 'gx', 'dark', false]
];
for (const [name, style, mode, passphrase] of shots) {
  const stored = { [KEY]: { style, mode, accent: 'default' } };
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
