import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const path of PAGES) {
  test(`/${path} loads with no errors, CSP violations or third-party requests`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const problems: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') problems.push(`console: ${message.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`page: ${error.message}`));
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== origin) problems.push(`request: ${url.href}`);
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) =>
        console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`));
    });

    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(problems).toEqual([]);
  });
}

for (const [path, lang] of [
  ['', 'en'], ['es/', 'es'], ['one-pager/', 'en'], ['es/one-pager/', 'es'], ['counter-card/', 'en'], ['es/counter-card/', 'es'],
] as const) {
  test(`/${path} declares its language and links every translation`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`https://shannonskipper.com/ashland-parking/${path}`);
    const alternates = Object.fromEntries(await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) =>
      links.map((link) => [link.getAttribute('hreflang'), link.getAttribute('href')])));
    const english = `https://shannonskipper.com/ashland-parking/${path.replace(/^es\//, '')}`;
    expect(alternates).toEqual({ en: english, es: english.replace('/ashland-parking/', '/ashland-parking/es/'), 'x-default': english });
  });
}

test('every external link opens a real page address, and none use http', async ({ page }) => {
  await page.goto('');
  const hrefs = await page.locator('a[href^="http"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const href of hrefs) expect(href).toMatch(/^https:\/\//);
});
