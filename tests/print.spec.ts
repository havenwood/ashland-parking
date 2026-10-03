import { expect, test } from '@playwright/test';

/**
 * One-page documents need slack: CI prints on Linux, where text can set a little longer
 * than on a laptop. Each page must fill at most 90% of its printable area. `pages` picks
 * each printed page's content; the counter card prints one face per page.
 */
const ONE_PAGERS = [
  { path: 'bill/memo/', inches: { width: 8.5 - 0.85 * 2, height: 11 - 0.7 * 2 }, pages: '.doc' },
  { path: 'one-pager/', inches: { width: 8.5 - 0.9 * 2, height: 11 - 0.75 - 0.6 }, pages: '.doc' },
  { path: 'es/one-pager/', inches: { width: 8.5 - 0.9 * 2, height: 11 - 0.75 - 0.6 }, pages: '.doc' },
  { path: 'counter-card/', inches: { width: 6 - 0.35 * 2, height: 4 - 0.3 * 2 }, pages: '.face-body' },
  { path: 'es/counter-card/', inches: { width: 6 - 0.35 * 2, height: 4 - 0.3 * 2 }, pages: '.face-body' },
];

for (const { path, inches, pages } of ONE_PAGERS) {
  test(`/${path} leaves room on each printed page`, async ({ page }) => {
    await page.emulateMedia({ media: 'print' });
    await page.setViewportSize({ width: Math.round(inches.width * 96), height: 1200 });
    await page.goto(path, { waitUntil: 'networkidle' });
    const sheets = await page.locator(pages).all();
    expect(sheets.length).toBeGreaterThan(0);
    for (const sheet of sheets) {
      // The content's own height, even where a face is drawn to fill its whole page.
      const used = await sheet.evaluate((el) => {
        el.style.setProperty('block-size', 'auto');
        return el.getBoundingClientRect().height;
      });
      expect(used / (inches.height * 96)).toBeLessThan(0.9);
    }
  });
}
