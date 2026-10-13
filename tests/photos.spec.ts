import { expect, test } from '@playwright/test';

for (const path of ['', 'es/'] as const) {
  test(`/${path} photos are decorative backdrop, load from this site and are credited in the footer`, async ({ page, baseURL }) => {
    await page.goto(path);
    const images = await page.locator('picture.photo img').all();
    expect(images.length).toBeGreaterThan(0);

    for (const image of images) {
      await expect(image).toHaveAttribute('alt', '');
      // Phones have no margin to put them in, so there they are neither shown nor loaded.
      if (!(await image.isVisible())) continue;
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      expect(new URL(await image.evaluate((img: HTMLImageElement) => img.currentSrc)).origin).toBe(new URL(baseURL!).origin);
    }

    // Credits live in the footer only: one line per photo, each with its source and its license.
    const credits = page.locator('footer .photo-credits li');
    await expect(credits).toHaveCount(images.length);
    for (const credit of await credits.all()) {
      const source = credit.locator('a:not([rel="license"])');
      const license = credit.locator('a[rel="license"]');
      await expect(source).toHaveCount(1);
      await expect(license).toHaveCount(1);
      for (const link of [source, license]) {
        await expect(link).toHaveAttribute('href', /^https:\/\//);
        expect((await link.textContent())?.trim()).toBeTruthy();
      }
    }
  });
}

test('the dark theme gets the night print of each photo', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Phones do not show the photos.');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('');
  const image = page.locator('picture.photo img').first();
  await image.scrollIntoViewIfNeeded();
  await expect(image).toHaveJSProperty('complete', true);
  expect(await image.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/-dark/);
});
