import { expect, test } from '@playwright/test';

test('an 8-hour shift on a 2-hour street goes from 3 moves to 1', async ({ page }) => {
  await page.goto('');
  const output = page.locator('#calculator output');
  await expect(output).toContainText(/3\D+1/);
});

test('changing the shift updates the announced result', async ({ page }) => {
  await page.goto('');
  await page.locator('#calc-hours').fill('10');
  await expect(page.locator('#calculator [data-sentence]')).toContainText(/4\D+2/);
  await page.locator('#calculator').getByRole('radio', { name: /lot/i }).check();
  await expect(page.locator('#calculator [data-sentence]')).toContainText(/2\D+1/);
});

test('the garage shows yearly savings', async ({ page }) => {
  await page.goto('');
  await page.locator('#calculator').getByRole('radio', { name: /garage/i }).check();
  await expect(page.locator('#calculator [data-sentence]')).toContainText('$715');
  await expect(page.locator('#calculator [data-sentence]')).toContainText('$360');
});

test('the time card punches each move of an 8-hour shift on a 2-hour street', async ({ page }) => {
  await page.goto('');
  const card = page.getByRole('table', { name: '8-hour shift, 2-hour street' });
  const rows = card.locator('tbody tr');
  await expect(rows.locator('th')).toHaveText(['0', '2', '4', '6', '8']);
  await expect(rows.locator('td.today')).toHaveText(['Clock in', 'Move car', 'Move car', 'Move car', 'Clock out']);
  await expect(rows.locator('td.pass')).toHaveText(['Clock in', 'Stay parked', 'Move car', 'Stay parked', 'Clock out']);
  // The totals carry the counts as text a screen reader can reach, not only as drawn counters.
  await expect(card.locator('tfoot td')).toHaveText(['3', '1']);

  await page.locator('#calc-hours').fill('10');
  const longer = page.getByRole('table', { name: '10-hour shift, 2-hour street' });
  await expect(longer.locator('tbody th')).toHaveText(['0', '2', '4', '6', '8', '10']);
  await expect(longer.locator('tfoot td')).toHaveText(['4', '2']);
  await page.locator('#calculator').getByRole('radio', { name: /lot/i }).check();
  await expect(page.getByRole('table', { name: '10-hour shift, 4-hour lot' }).locator('tbody td.today'))
    .toHaveText(['Clock in', 'Move car', 'Move car', 'Clock out']);
});

test('the garage prints a receipt that shows its arithmetic', async ({ page }) => {
  await page.goto('');
  await page.locator('#calculator').getByRole('radio', { name: /garage/i }).check();
  const receipt = page.locator('#calculator [data-receipt]');
  await expect(receipt).toBeVisible();
  await expect(page.locator('#calculator .timecard')).toBeHidden();
  await expect(receipt).toContainText('$2.75 a day × 5 days × 52 weeks');
  await expect(receipt).toContainText('$30 a month × 12');
  await expect(receipt.locator('.lines dd')).toHaveText(['$715', '$360', '$0']);
  await expect(receipt.locator('.totals dd')).toHaveText(['715', '360']);
  // The City's $40 fee schedule stays in the source note under the calculator.
  await expect(page.locator('#calculator .source')).toContainText('$40');

  await page.locator('#calc-days').fill('1');
  await expect(receipt).toContainText('$2.75 a day × 1 day × 52 weeks');
  await expect(receipt.locator('.lines dd').first()).toHaveText('$143');
});

test('the Spanish receipt reads in Spanish', async ({ page }) => {
  await page.goto('es/');
  await page.locator('#calculator').getByRole('radio', { name: /garaje/i }).check();
  await expect(page.locator('#calculator [data-receipt]')).toContainText('$2.75 al día × 5 días × 52 semanas');
});
