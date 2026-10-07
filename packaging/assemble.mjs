// Copies the shipped files into build/<target>/ with a transformed manifest.
// The per-browser build scripts (safari/, chrome/) call this.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export function assemble(target, toManifest) {
  const out = `${root}build/${target}/`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const entry of ['background.js', 'popup', 'src', 'icons']) {
    cpSync(`${root}${entry}`, `${out}${entry}`, { recursive: true });
  }

  const manifest = JSON.parse(readFileSync(`${root}manifest.json`, 'utf8'));
  writeFileSync(`${out}manifest.json`, `${JSON.stringify(toManifest(manifest), null, 2)}\n`);
  return out;
}
