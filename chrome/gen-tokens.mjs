// Prints the popup.css token blocks for the Chromium looks, generated from
// CHROMIUM_PALETTES in src/appearance.js. When you change a palette, paste this
// output over the "Chromium palettes" section of popup/popup.css (a test fails
// until the two agree).
import { CHROMIUM_PALETTES } from '../src/appearance.js';
import { mix, normalizeColor as n } from '../src/theme.js';
const W = n('#ffffff'), B = n('#000000');
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const m = (a, b, t) => hex(mix(n(a), n(b), t));
const METER = {
  light: ['#d70022', '#d76e00', '#a47f00', '#058b00'],
  dark: ['#ff9aa2', '#ffb68a', '#ffe07a', '#a6e8bf']
};
function tokens(p, mode) {
  const dark = mode === 'dark';
  const far = dark ? W : B;
  const meter = METER[mode];
  return [
    ['--bg', p.bg], ['--bg-sunken', p.sunken], ['--bg-raised', p.raised],
    ['--border', p.border], ['--border-strong', p.borderStrong],
    ['--text', p.text], ['--text-muted', p.muted],
    ['--button-bg', p.raised],
    ['--surface-hover', m(p.bg, p.text, dark ? 0.12 : 0.08)],
    ['--surface-active', m(p.bg, p.text, dark ? 0.2 : 0.14)],
    ['--accent', p.accent],
    ['--accent-hover', m(p.accent, hex(far), 0.15)],
    ['--accent-active', m(p.accent, hex(far), 0.3)],
    ['--accent-text', p.accentText],
    ['--focus-ring', p.accent],
    ['--danger', dark ? '#ff9aa2' : '#c50042'],
    ['--success', dark ? '#a6e8bf' : '#017a4a'],
    ['--s0', meter[0]], ['--s1', meter[1]], ['--s2', meter[2]], ['--s3', meter[3]], ['--s4', p.accent]
  ];
}
const body = (list, pad) => list.map(([k, v]) => `${pad}${k}: ${v};`).join('\n');
const SHAPES = {
  chrome: ['12px', '20px', '999px', '999px'],
  edge: ['6px', '8px', '4px', '2px'],
  brave: ['10px', '16px', '999px', '999px'],
  gx: ['2px', '4px', '2px', '1px']
};
export function chromiumCss() {
let out = '';
for (const [id, pal] of Object.entries(CHROMIUM_PALETTES)) {
  const [r, rl, rp, rpi] = SHAPES[id];
  const sel = `:root[data-style="${id}"]`;
  out += `${sel} {\n${body(tokens(pal.light, 'light'), '  ')}\n\n  --radius: ${r};\n  --radius-lg: ${rl};\n  --radius-pill: ${rp};\n  --radius-pill-inner: ${rpi};\n}\n\n`;
  out += `@media (prefers-color-scheme: dark) {\n  ${sel}:not([data-theme="light"]) {\n${body(tokens(pal.dark, 'dark'), '    ')}\n  }\n}\n\n`;
  out += `${sel}[data-theme="dark"] {\n${body(tokens(pal.dark, 'dark'), '  ')}\n}\n\n`;
}
return out;
}

if (process.argv[1]?.endsWith('gen-tokens.mjs')) process.stdout.write(chromiumCss());
