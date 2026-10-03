import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

test('the map toggle recolors block faces without JavaScript', async ({ page }) => {
  await page.goto('');
  const face = page.locator('#map .faces [data-limit="2"]').first();
  const before = await face.evaluate((el) => getComputedStyle(el).stroke);
  await page.locator('#map').getByRole('radio', { name: /with (a )?pass/i }).check();
  await expect.poll(() => face.evaluate((el) => getComputedStyle(el).stroke)).not.toBe(before);
});

test('the qualifier reveals a result without JavaScript', async ({ page }) => {
  await page.goto('');
  const result = page.locator('#qualify [data-result="yes"]');
  await expect(result).toBeHidden();
  for (const group of await page.locator('#qualify fieldset').all()) {
    await group.getByRole('radio').first().check();
  }
  await expect(result).toBeVisible();
});

test('three yeses hang a pass tag, outside the status region, without JavaScript', async ({ page }) => {
  await page.goto('');
  const tag = page.locator('#qualify figure.tag-figure');
  await expect(tag).toBeHidden();
  for (const group of await page.locator('#qualify fieldset').all()) {
    await group.getByRole('radio').first().check();
  }
  await expect(tag).toBeVisible();
  await expect(tag).toContainText('No fee');
  await expect(tag.locator('figcaption')).toContainText('subsection D');
  // The status region announces the short answer; the tag is there to look at, not to be read out whole.
  await expect(tag.locator('xpath=ancestor-or-self::*[@role="status" or @aria-live]')).toHaveCount(0);
  await expect(page.locator('#qualify [role="status"]')).not.toContainText('No fee');
  await page.locator('#q3-no').check();
  await expect(tag).toBeHidden();
});

test('each subsection of the bill has one highlighted clause, with a matching mark in its note', async ({ page }) => {
  for (const path of ['', 'es/']) {
    await page.goto(path);
    for (const letter of ['a', 'b', 'c', 'd']) {
      const sub = page.locator(`#bill-${letter}`);
      await expect(sub.locator('.text mark')).toHaveCount(1);
      await expect(sub.locator('.note.margin mark')).toHaveCount(1);
      await expect(sub.locator('.note.inline mark')).toHaveCount(1);
    }
  }
});

test('the bill says plainly that it is draft language', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('#bill .draft-notice')).toBeVisible();
  await page.goto('bill/print/');
  await expect(page.locator('.draft-label')).toContainText('Not adopted');
});

test('the shift table stands in for the calculator', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('#calculator .noscript-note')).toBeVisible();
  await page.locator('#calculator summary').click();
  await expect(page.locator('#calculator .lookup table')).toBeVisible();
});
