import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PAGES } from './pages.ts';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/** axe with every WCAG 2.2 AA rule on; target-size (SC 2.5.8) is off by default. */
const axe = (page: Page) =>
  new AxeBuilder({ page }).withTags(TAGS).options({ rules: { 'target-size': { enabled: true } } });

// Measure final colors, not text caught midway through a fade-in.
test.use({ reducedMotion: 'reduce' });

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });
    for (const path of PAGES) {
      test(`/${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        const { violations } = await axe(page).analyze();
        expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(', ')}`)).toEqual([]);
      });
    }
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`revealed states have no violations: map, pass tag, time card, receipt (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('');
    const check = async (state: string) => {
      const { violations } = await axe(page).analyze();
      expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => `${node.target} ${node.failureSummary}`).join('; ')}`), state).toEqual([]);
    };
    await page.getByRole('radio', { name: /with (a )?pass/i }).first().check();
    for (const group of await page.locator('#qualify fieldset').all()) {
      await group.getByRole('radio').first().check();
    }
    await expect(page.locator('#qualify .tag-figure')).toBeVisible();
    await page.locator('#calc-hours').fill('9');
    await expect(page.getByRole('table', { name: /^9-hour shift/ })).toBeVisible();
    await check('map pass view, pass tag, time card');
    await page.locator('#calculator').getByRole('radio', { name: /garage/i }).check();
    await expect(page.locator('#calculator [data-receipt]')).toBeVisible();
    await check('garage receipt');
  });
}
