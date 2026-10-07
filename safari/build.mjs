// Assembles a Safari-ready copy of the extension in build/safari/. Feed that
// folder to `xcrun safari-web-extension-converter` on a Mac (see docs/safari.md).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toSafariManifest } from './manifest.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = `${root}build/safari/`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of ['background.js', 'popup', 'src', 'icons']) {
  cpSync(`${root}${entry}`, `${out}${entry}`, { recursive: true });
}

const manifest = JSON.parse(readFileSync(`${root}manifest.json`, 'utf8'));
writeFileSync(`${out}manifest.json`, `${JSON.stringify(toSafariManifest(manifest), null, 2)}\n`);

console.log(`Safari extension folder written to ${out}`);
