// Renders the SVG icons to PNG for the Safari build. Run `npm run icons:safari`
// after changing icons/*.svg and commit the result in icons/png/; the build
// itself does not need a browser. Needs `npx playwright install chromium`.
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = `${root}icons/png/`;
mkdirSync(out, { recursive: true });

// App/extension icon. The Xcode app icon uses the largest.
const APP_SIZES = [48, 96, 128, 256, 512];
// Toolbar icon (icons/toolbar-safari.svg, an outline lock). Safari's toolbar slot is 19pt, so these are the 1x/2x/3x sizes
// (anything else gets resampled and looks soft). Rendered black on transparent
// so Safari treats it as a template image and tints it like its own icons.
const TOOLBAR_SIZES = [19, 38, 57];
const TOOLBAR_COLOR = '#000';

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(svgFile, size, outFile, color) {
  // Swap the Firefox-only `context-fill` for a fixed colour (default: its fallback).
  const svg = readFileSync(`${root}icons/${svgFile}`, 'utf8')
    .replace(/context-fill (#[0-9a-f]{3,8})/gi, color ?? '$1')
    .replace(/\s+(?:fill|stroke)-opacity="context-fill-opacity"/g, '');
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`
  );
  await page.screenshot({ path: `${out}${outFile}`, omitBackground: true });
}

for (const size of APP_SIZES) await render('icon.svg', size, `icon-${size}.png`);
for (const size of TOOLBAR_SIZES) await render('toolbar-safari.svg', size, `toolbar-${size}.png`, TOOLBAR_COLOR);

await browser.close();
console.log(`Icons written to ${out}`);
