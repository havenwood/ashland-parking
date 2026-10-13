import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const FACES = 23;
const LOTS = 6;

const withPass = (page: Page) => page.locator('#map').getByRole('radio', { name: /with (a )?pass/i }).check();

test('the map names its landmarks and carries a scale', async ({ page }) => {
  await page.goto('');
  const labels = page.locator('#map .labels');
  for (const name of ['Plaza', 'Lithia', 'Ashland Creek', 'Shakespeare', 'City Hall', 'Post Office', 'Library', 'Hargadine']) {
    await expect(labels).toContainText(name);
  }
  await expect(page.locator('#map .key')).toContainText('500 ft');
  // These stay on screen at every width; minor names step aside on phones.
  for (const place of ['park', 'plaza', 'garage']) await expect(labels.locator(`[data-place="${place}"]`)).toBeVisible();
});

test('the Spanish map names its landmarks in Spanish', async ({ page }) => {
  await page.goto('es/');
  const labels = page.locator('#map .labels');
  for (const name of ['Garaje', 'Biblioteca', 'Ayuntamiento', 'Festival de']) await expect(labels).toContainText(name);
  await expect(page.locator('#map .key')).toContainText('500 pies');
});

test('every block face and lot is a named image, and the table lists each one', async ({ page }) => {
  await page.goto('');
  await expect(page.locator('#map svg [role="img"]')).toHaveCount(FACES + LOTS);
  await expect(page.locator('#map tbody tr')).toHaveCount(FACES + LOTS);
  await expect(page.getByRole('img', { name: 'East Main, 1st to 2nd: 2 hours, 4 with a pass' })).toBeAttached();
  await expect(page.getByRole('img', { name: 'Water, Lithia Way to North Main: 2 hours, 4 with a pass' })).toBeAttached();
  await expect(page.getByRole('img', { name: /^Hargadine parking structure: paid garage/ })).toBeAttached();
  // The drawing's labels are for the eye; the names above already say it all.
  await expect(page.locator('#map .labels')).toHaveAttribute('aria-hidden', 'true');
});

test('hovering a block face thickens it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Touch screens have no hover.');
  await page.goto('');
  const face = page.locator('#map .face[data-limit="2"]').first();
  const before = await face.evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth));
  await face.hover({ force: true });
  await expect.poll(() => face.evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth))).toBeGreaterThan(before);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`time-limit lines and lots keep 3:1 contrast against the street (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('');
    for (const pass of [false, true]) {
      if (pass) await withPass(page);
      const ratios = await page.locator('#map .canvas svg').evaluate((svg) => {
        const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
        const luminance = (color: string) => {
          canvas.clearRect(0, 0, 1, 1);
          canvas.fillStyle = color;
          canvas.fillRect(0, 0, 1, 1);
          const [r, g, b] = [...canvas.getImageData(0, 0, 1, 1).data].map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (a: string, b: string) => {
          const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
          return (light + 0.05) / (dark + 0.05);
        };
        const street = getComputedStyle(svg.querySelector('.ground .street')!).stroke;
        const marks = [...svg.querySelectorAll<SVGElement>('.face, .lot')].map((mark) => {
          const style = getComputedStyle(mark);
          const ink = mark.classList.contains('face') || mark.dataset.limit === 'none' ? style.stroke : style.fill;
          return { mark: `${mark.getAttribute('class')} ${mark.dataset.limit}`, ratio: ratio(ink, street) };
        });
        return marks.filter(({ ratio }) => ratio < 3);
      });
      expect(ratios, `pass view: ${pass}`).toEqual([]);
    }
  });
}

test('the pass view has no axe violations in the dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('');
  await withPass(page);
  const { violations } = await new AxeBuilder({ page })
    .include('#map')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  expect(violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target).join(', ')}`)).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the pass view recolors lines, lots and the legend', async ({ page }) => {
    await page.goto('');
    const marks = {
      face: page.locator('#map .faces .face[data-limit="4"]').first(),
      lot: page.locator('#map .lots .lot[data-limit="garage"]'),
      legend: page.locator('#map .legend .face[data-limit="2"]'),
    };
    const paint = async () => ({
      face: await marks.face.evaluate((el) => getComputedStyle(el).stroke),
      lot: await marks.lot.evaluate((el) => getComputedStyle(el).fill),
      legend: await marks.legend.evaluate((el) => getComputedStyle(el).stroke),
    });
    const today = await paint();
    await withPass(page);
    await expect.poll(async () => {
      const pass = await paint();
      return Object.keys(today).filter((key) => today[key as keyof typeof today] === pass[key as keyof typeof pass]);
    }).toEqual([]);
    await expect(page.locator('#map .legend')).toContainText('8 hours');
  });
});
