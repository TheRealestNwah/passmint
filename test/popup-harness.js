/**
 * Loads popup/popup.html in headless Chromium with the extension APIs stubbed,
 * so popup.js can be exercised end to end without a Firefox profile.
 *
 * The repo is served over http://127.0.0.1 (a secure context, so the Clipboard
 * API exists) by a tiny static server; there is no build step to run first.
 *
 * Each popup gets a fresh browser context. What it sees is set by `openPopup`
 * options, and everything the popup writes is recorded on `window.__harness`:
 *
 *   storage     'browser' (default), 'chrome', 'none', 'get-rejects', 'set-rejects'
 *   stored      initial contents of storage.local
 *   browserName what runtime.getBrowserInfo reports (default 'Firefox')
 *   theme       what theme.getCurrent resolves to (default: no theme)
 *   clipboard   'ok' (default) or 'rejects', to force the textarea fallback
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json'
};

function startServer() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/** Runs in the page before any of its own scripts. */
function installStubs(cfg) {
  const h = (window.__harness = {
    sets: [],
    clipboard: [],
    execCommand: [],
    themeListeners: [],
    store: JSON.parse(JSON.stringify(cfg.stored ?? {}))
  });
  const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

  const local = {
    async get(key) {
      if (cfg.storage === 'get-rejects') throw new Error('storage.get failed');
      return key in h.store ? { [key]: clone(h.store[key]) } : {};
    },
    async set(items) {
      if (cfg.storage === 'set-rejects') throw new Error('storage.set failed');
      h.sets.push(clone(items));
      Object.assign(h.store, clone(items));
    }
  };

  if (cfg.storage === 'chrome') {
    window.chrome = { storage: { local } };
  } else if (cfg.storage !== 'none') {
    window.browser = {
      storage: { local },
      runtime: { getBrowserInfo: async () => ({ name: cfg.browserName ?? 'Firefox' }) },
      theme: {
        getCurrent: async () => clone(cfg.theme ?? {}),
        onUpdated: { addListener: (fn) => h.themeListeners.push(fn) }
      }
    };
  }

  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text) => {
        if (cfg.clipboard === 'rejects') throw new DOMException('Denied', 'NotAllowedError');
        h.clipboard.push(text);
      }
    }
  });
  document.execCommand = (command) => {
    h.execCommand.push({ command, text: document.querySelector('textarea')?.value ?? null });
    return true;
  };
}

export async function createHarness() {
  const server = await startServer();
  const browser = await chromium.launch();
  const base = `http://127.0.0.1:${server.address().port}/popup/popup.html`;

  return {
    base,

    /** Open the popup and wait until it has painted and generated (or failed to). */
    async openPopup(cfg = {}) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (err) => errors.push(err));
      await page.addInitScript(installStubs, cfg);
      await page.goto(base);
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.style &&
          (document.getElementById('result').textContent || !document.getElementById('error').hidden)
      );
      return { page, context, errors };
    },

    async close() {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    }
  };
}
