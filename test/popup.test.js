import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { ACCENTS, accentTokens } from '../src/appearance.js';
import { createHarness } from './popup-harness.js';

const SETTINGS_KEY = 'passforge:settings';
const APPEARANCE_KEY = 'passmint:appearance';
const SNAPSHOT_KEY = 'passmint:appearance-snapshot';

const FIREFOX_DARK = {
  colors: {
    popup: '#42414d',
    popup_text: '#fbfbfe',
    popup_highlight: '#0060df',
    popup_highlight_text: '#ffffff'
  }
};

let harness;
before(async () => {
  harness = await createHarness();
});
after(async () => {
  await harness?.close();
});

/** Opens a popup, runs `fn`, then checks the page never threw. */
async function withPopup(cfg, fn) {
  const popup = await harness.openPopup(cfg);
  try {
    await fn(popup.page);
    assert.deepEqual(popup.errors.map(String), [], 'popup threw');
  } finally {
    await popup.context.close();
  }
}

const result = (page) => page.locator('#result').textContent();
const recorded = (page) => page.evaluate(() => window.__harness);
const isHidden = (page, selector) => page.locator(selector).evaluate((el) => el.hidden);
const rootData = (page) => page.evaluate(() => ({ ...document.documentElement.dataset }));
const rootProp = (page, name) =>
  page.evaluate((n) => document.documentElement.style.getPropertyValue(n), name);

/** Resolves once the result differs from `previous`. */
const nextResult = (page, previous) =>
  page.waitForFunction((p) => document.getElementById('result').textContent !== p, previous);

describe('generating', () => {
  test('opens with a 20-character password from the defaults', async () => {
    await withPopup({}, async (page) => {
      assert.equal((await result(page)).length, 20);
      assert.equal(await page.locator('#tab-password').getAttribute('aria-selected'), 'true');
      assert.match(await page.locator('#entropy').textContent(), /bits of entropy/);
    });
  });

  test('the number box clamps and drives the slider', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#length-number').fill('500');
      assert.equal(await page.locator('#length').inputValue(), '128');
      assert.equal((await result(page)).length, 128);

      await page.locator('#length-number').fill('12');
      assert.equal(await page.locator('#length').inputValue(), '12');
      assert.equal((await result(page)).length, 12);
    });
  });

  test('a preset rewrites the form and the result', async () => {
    await withPopup({}, async (page) => {
      await page.locator('.chip[data-preset="pin"]').click();
      assert.match(await result(page), /^\d{6}$/);
      assert.equal(await page.locator('#length').inputValue(), '6');
      assert.equal(await page.locator('#uppercase').isChecked(), false);
    });
  });

  test('the passphrase tab swaps panels and generates words', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#tab-passphrase').click();
      assert.equal(await isHidden(page, '#panel-password'), true);
      assert.equal(await isHidden(page, '#panel-passphrase'), false);
      assert.equal((await result(page)).split('-').length, 6);
    });
  });

  test('an impossible combination shows the error instead of a result', async () => {
    await withPopup({}, async (page) => {
      for (const id of ['uppercase', 'lowercase', 'digits', 'symbols']) {
        await page.locator(`#${id}`).uncheck();
      }
      assert.equal(await result(page), '');
      assert.equal(await isHidden(page, '#error'), false);
      assert.match(await page.locator('#error').textContent(), /at least one character type/);
    });
  });
});

describe('copy', () => {
  test('the Copy button writes the result to the clipboard', async () => {
    await withPopup({}, async (page) => {
      const value = await result(page);
      await page.locator('#copy').click();
      assert.deepEqual((await recorded(page)).clipboard, [value]);
    });
  });

  test('the button confirms, then reverts', async () => {
    await withPopup({}, async (page) => {
      const copy = page.locator('#copy');
      await copy.click();
      assert.equal(await copy.textContent(), 'Copied');
      assert.match(await copy.getAttribute('class'), /is-copied/);
      await page.waitForFunction(() => document.getElementById('copy').textContent === 'Copy');
      assert.doesNotMatch(await copy.getAttribute('class'), /is-copied/);
    });
  });

  test('falls back to execCommand when the Clipboard API refuses', async () => {
    await withPopup({ clipboard: 'rejects' }, async (page) => {
      const value = await result(page);
      await page.locator('#copy').click();
      assert.deepEqual((await recorded(page)).execCommand, [{ command: 'copy', text: value }]);
      assert.equal(await page.locator('textarea').count(), 0, 'fallback textarea left behind');
      assert.equal(await page.locator('#copy').textContent(), 'Copied');
    });
  });

  test('does nothing when there is no result', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#symbols').uncheck();
      await page.locator('#digits').uncheck();
      await page.locator('#lowercase').uncheck();
      await page.locator('#uppercase').uncheck();
      await page.locator('#copy').click();
      const h = await recorded(page);
      assert.deepEqual(h.clipboard, []);
      assert.deepEqual(h.execCommand, []);
      assert.equal(await page.locator('#copy').textContent(), 'Copy');
    });
  });

  test('clicking the result selects all of it', async () => {
    await withPopup({}, async (page) => {
      const value = await result(page);
      await page.locator('#result').click();
      assert.equal(await page.evaluate(() => getSelection().toString()), value);
    });
  });
});

describe('keyboard shortcuts', () => {
  test('Ctrl+Space generates a new result', async () => {
    await withPopup({}, async (page) => {
      const first = await result(page);
      await page.keyboard.press('Control+Space');
      await nextResult(page, first);
      assert.equal((await result(page)).length, 20);
    });
  });

  test('Ctrl+C copies when nothing is selected', async () => {
    await withPopup({}, async (page) => {
      const value = await result(page);
      await page.keyboard.press('Control+KeyC');
      assert.deepEqual((await recorded(page)).clipboard, [value]);
    });
  });

  test('Cmd+C copies too', async () => {
    await withPopup({}, async (page) => {
      const value = await result(page);
      await page.keyboard.press('Meta+KeyC');
      assert.deepEqual((await recorded(page)).clipboard, [value]);
    });
  });

  test('Ctrl+C leaves an existing selection to the browser', async () => {
    await withPopup({}, async (page) => {
      await page.locator('.footer').selectText();
      await page.keyboard.press('Control+KeyC');
      assert.deepEqual((await recorded(page)).clipboard, []);
      assert.equal(await page.locator('#copy').textContent(), 'Copy');
    });
  });

  test('plain keys do nothing', async () => {
    await withPopup({}, async (page) => {
      const value = await result(page);
      await page.keyboard.press('KeyC');
      await page.keyboard.press('Space');
      assert.deepEqual((await recorded(page)).clipboard, []);
      assert.equal(await result(page), value);
    });
  });
});

describe('storage', () => {
  test('restores saved settings when the popup opens', async () => {
    const stored = { [SETTINGS_KEY]: { mode: 'passphrase', wordCount: 4, separator: '.' } };
    await withPopup({ stored }, async (page) => {
      assert.equal(await page.locator('#tab-passphrase').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#word-count').inputValue(), '4');
      assert.equal(await page.locator('#word-count-number').inputValue(), '4');
      assert.equal((await result(page)).split('.').length, 4);
    });
  });

  test('fills settings missing from an older save with the defaults', async () => {
    await withPopup({ stored: { [SETTINGS_KEY]: { length: 30 } } }, async (page) => {
      assert.equal((await result(page)).length, 30);
      assert.equal(await page.locator('#symbols').isChecked(), true);
      assert.equal(await page.locator('#separator').inputValue(), '-');
    });
  });

  test('saves every change under the settings key', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#length-number').fill('32');
      await page.locator('#tab-passphrase').click();
      const { store } = await recorded(page);
      assert.equal(store[SETTINGS_KEY].length, 32);
      assert.equal(store[SETTINGS_KEY].mode, 'passphrase');
    });
  });

  test('uses chrome.storage when browser.* is absent', async () => {
    const stored = { [SETTINGS_KEY]: { length: 9 } };
    await withPopup({ storage: 'chrome', stored }, async (page) => {
      assert.equal((await result(page)).length, 9);
      await page.locator('#length-number').fill('11');
      assert.equal((await recorded(page)).store[SETTINGS_KEY].length, 11);
    });
  });

  test('works from defaults with no storage API at all', async () => {
    await withPopup({ storage: 'none' }, async (page) => {
      assert.equal((await result(page)).length, 20);
      await page.locator('#length-number').fill('14');
      assert.equal((await result(page)).length, 14);
      await page.locator('#appearance-toggle').click();
      await page.locator('input[name="appearance-mode"][value="dark"]').check({ force: true });
      assert.equal((await rootData(page)).theme, 'dark');
    });
  });

  test('falls back to defaults when reading storage fails', async () => {
    const stored = { [SETTINGS_KEY]: { length: 40 }, [APPEARANCE_KEY]: { mode: 'dark' } };
    await withPopup({ storage: 'get-rejects', stored }, async (page) => {
      assert.equal((await result(page)).length, 20);
      assert.equal((await rootData(page)).theme, undefined);
    });
  });

  test('keeps generating when saving fails', async () => {
    await withPopup({ storage: 'set-rejects' }, async (page) => {
      await page.locator('#length-number').fill('25');
      assert.equal((await result(page)).length, 25);
      await page.locator('#appearance-toggle').click();
      await page.locator('input[name="appearance-mode"][value="light"]').check({ force: true });
      assert.equal((await rootData(page)).theme, 'light');
      assert.deepEqual((await recorded(page)).sets, []);
    });
  });
});

describe('Appearance panel', () => {
  const pick = (page, name, value) =>
    page.locator(`input[name="${name}"][value="${value}"]`).check({ force: true });
  const checked = (page, name) =>
    page.locator(`input[name="${name}"]:checked`).evaluate((el) => el.value);

  test('the toggle swaps the generator options for the panel and back', async () => {
    await withPopup({}, async (page) => {
      const toggle = page.locator('#appearance-toggle');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
      assert.equal(await isHidden(page, '#panel-appearance'), false);
      assert.equal(await isHidden(page, '#panel-password'), true);
      assert.equal(await isHidden(page, '.presets'), true);

      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
      assert.equal(await isHidden(page, '#panel-appearance'), true);
      assert.equal(await isHidden(page, '#panel-password'), false);
      assert.equal(await isHidden(page, '.presets'), false);
    });
  });

  test('choosing a generator tab closes the panel', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#appearance-toggle').click();
      await page.locator('#tab-passphrase').click();
      assert.equal(await isHidden(page, '#panel-appearance'), true);
      assert.equal(await isHidden(page, '#panel-passphrase'), false);
      assert.equal(await page.locator('#appearance-toggle').getAttribute('aria-pressed'), 'false');
    });
  });

  test('builds one swatch per Waterfox theme colour', async () => {
    await withPopup({}, async (page) => {
      const values = await page
        .locator('#accent-swatches input[name="accent"]')
        .evaluateAll((els) => els.map((el) => el.value));
      assert.deepEqual(values, ACCENTS.map((a) => a.id));
    });
  });

  test('Auto in Firefox paints the Firefox look without accents', async () => {
    await withPopup({ browserName: 'Firefox' }, async (page) => {
      assert.equal((await rootData(page)).style, 'photon');
      assert.equal(await checked(page, 'appearance-style'), 'auto');
      assert.equal(await checked(page, 'appearance-mode'), 'system');
      assert.equal(await checked(page, 'accent'), 'default');
      assert.equal(await isHidden(page, '#accent-block'), true);
      assert.match(await page.locator('#style-hint').textContent(), /Switches to Nova/);
    });
  });

  test('Auto in Waterfox paints Nova and offers accents', async () => {
    await withPopup({ browserName: 'Waterfox' }, async (page) => {
      assert.equal((await rootData(page)).style, 'nova');
      assert.equal(await isHidden(page, '#accent-block'), false);
      assert.match(await page.locator('#style-hint').textContent(), /Waterfox detected/);
      assert.equal(await rootProp(page, '--nova-accent-d'), accentTokens('default')['--nova-accent-d']);
    });
  });

  test('forcing a style repaints, saves and explains itself', async () => {
    await withPopup({}, async (page) => {
      await page.locator('#appearance-toggle').click();
      await pick(page, 'appearance-style', 'nova');
      assert.equal((await rootData(page)).style, 'nova');
      assert.equal(await isHidden(page, '#accent-block'), false);
      assert.equal(await page.locator('#style-hint').textContent(), 'Always the Waterfox Nova look.');
      assert.deepEqual((await recorded(page)).store[APPEARANCE_KEY], {
        style: 'nova',
        mode: 'system',
        accent: 'default'
      });

      await pick(page, 'appearance-style', 'photon');
      assert.equal((await rootData(page)).style, 'photon');
      assert.equal(await isHidden(page, '#accent-block'), true);
      assert.equal(await page.locator('#style-hint').textContent(), 'Always the Firefox look.');
      assert.equal(await rootProp(page, '--nova-accent-d'), '');
    });
  });

  test('forced light and dark override the browser theme', async () => {
    await withPopup({ theme: FIREFOX_DARK }, async (page) => {
      assert.equal((await rootData(page)).theme, 'dark', 'follows the theme in system mode');
      await page.locator('#appearance-toggle').click();

      await pick(page, 'appearance-mode', 'light');
      assert.equal((await rootData(page)).theme, 'light');
      assert.equal((await recorded(page)).store[APPEARANCE_KEY].mode, 'light');

      await pick(page, 'appearance-mode', 'dark');
      assert.equal((await rootData(page)).theme, 'dark');

      await pick(page, 'appearance-mode', 'system');
      assert.equal((await rootData(page)).theme, 'dark');
      assert.notEqual(await rootProp(page, '--bg'), '', 'theme colours come back');
    });
  });

  test('picking an accent sets its tokens for both modes', async () => {
    await withPopup({ browserName: 'Waterfox' }, async (page) => {
      await page.locator('#appearance-toggle').click();
      await pick(page, 'accent', 'lagoon');
      const tokens = accentTokens('lagoon');
      for (const name of ['--nova-accent-d', '--nova-accent-l', '--nova-focus-l']) {
        assert.equal(await rootProp(page, name), tokens[name], name);
      }
      assert.equal((await recorded(page)).store[APPEARANCE_KEY].accent, 'lagoon');
    });
  });

  test('restores saved preferences and discards invalid ones', async () => {
    const stored = { [APPEARANCE_KEY]: { style: 'nova', mode: 'dark', accent: 'pine' } };
    await withPopup({ stored }, async (page) => {
      assert.deepEqual(await rootData(page), { style: 'nova', theme: 'dark' });
      assert.equal(await checked(page, 'accent'), 'pine');
      assert.equal(await rootProp(page, '--nova-accent-d'), accentTokens('pine')['--nova-accent-d']);
    });

    const junk = { [APPEARANCE_KEY]: { style: 'aero', mode: 'dark', accent: 'mauve' } };
    await withPopup({ stored: junk }, async (page) => {
      assert.equal(await checked(page, 'appearance-style'), 'auto');
      assert.equal(await checked(page, 'appearance-mode'), 'dark');
      assert.equal(await checked(page, 'accent'), 'default');
    });
  });

  test('repaints when the browser theme changes while open', async () => {
    await withPopup({}, async (page) => {
      assert.equal((await rootData(page)).theme, undefined);
      await page.evaluate((theme) => {
        for (const fn of window.__harness.themeListeners) fn({ theme });
      }, FIREFOX_DARK);
      assert.equal((await rootData(page)).theme, 'dark');

      await page.evaluate(() => {
        for (const fn of window.__harness.themeListeners) fn({ theme: {} });
      });
      assert.equal((await rootData(page)).theme, undefined);
      assert.equal(await rootProp(page, '--bg'), '', 'no leftovers from the dark theme');
    });
  });

  test('boot.js repaints the last look before popup.js runs', async () => {
    const { page, context, errors } = await harness.openPopup({ browserName: 'Waterfox' });
    try {
      await page.locator('#appearance-toggle').click();
      await page.locator('input[name="appearance-mode"][value="dark"]').check({ force: true });
      await page.locator('input[name="accent"][value="flame"]').check({ force: true });

      const snapshot = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), SNAPSHOT_KEY));
      assert.equal(snapshot.style, 'nova');
      assert.equal(snapshot.theme, 'dark');
      assert.match(snapshot.css, /--nova-accent-d/);

      // Reopen with popup.js blocked, so only the snapshot can paint the root.
      await page.route('**/popup/popup.js', (route) => route.abort());
      await page.reload();
      await page.waitForLoadState('load');
      assert.deepEqual(await rootData(page), { style: 'nova', theme: 'dark' });
      assert.equal(await rootProp(page, '--nova-accent-d'), accentTokens('flame')['--nova-accent-d']);
      assert.equal(await result(page), '', 'popup.js really was blocked');
      assert.deepEqual(errors.map(String), []);
    } finally {
      await context.close();
    }
  });

  test('boot.js shrugs off a corrupt snapshot', async () => {
    const { page, context, errors } = await harness.openPopup();
    try {
      await page.evaluate((k) => localStorage.setItem(k, '{not json'), SNAPSHOT_KEY);
      await page.route('**/popup/popup.js', (route) => route.abort());
      await page.reload();
      await page.waitForLoadState('load');
      assert.deepEqual(await rootData(page), {});
      assert.deepEqual(errors.map(String), []);
    } finally {
      await context.close();
    }
  });
});
