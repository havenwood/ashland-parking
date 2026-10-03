/**
 * Prints the bill, cover memo, one-pagers and counter cards to PDF and renders the social image,
 * writing them into dist/. Run after `astro build`:
 *
 *   node scripts/make-pdfs.ts
 */
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BASE = '/ashland-parking';
const astro = (...args: string[]) => execFileSync('npx', ['astro', 'preview', ...args], { stdio: 'inherit' });

/** `pages` is the most the document may run; the build fails if it runs longer. */
const PDFS = [
  { path: '/bill/print/', file: 'ashland-worker-parking-ordinance.pdf', pages: 4 },
  { path: '/bill/memo/', file: 'ashland-worker-parking-memo.pdf', pages: 1 },
  { path: '/one-pager/', file: 'ashland-worker-parking-one-pager.pdf', pages: 1 },
  { path: '/es/one-pager/', file: 'ashland-worker-parking-one-pager-es.pdf', pages: 1 },
  // 6 × 4 in: the front for a break room, the back for a counter.
  { path: '/counter-card/', file: 'ashland-worker-parking-counter-card.pdf', pages: 2 },
  { path: '/es/counter-card/', file: 'ashland-worker-parking-counter-card-es.pdf', pages: 2 },
];
const pageCount = (pdf: Buffer) => pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;

astro('--background', '--force', ...(process.env.PREVIEW_PORT ? ['--port', process.env.PREVIEW_PORT] : []));
const browser = await chromium.launch();
try {
  const { url } = JSON.parse(await readFile('.astro/preview.json', 'utf8')) as { url: string };
  const origin = new URL(url).origin;
  const page = await browser.newPage();

  for (const { path, file, pages } of PDFS) {
    const response = await page.goto(`${origin}${BASE}${path}`, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`${path} returned ${response?.status()}`);
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ path: `dist/${file}`, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
    const count = pageCount(pdf);
    if (count > pages) throw new Error(`${file} runs ${count} pages; it must fit in ${pages}.`);
    console.log(`dist/${file} (${count} ${count === 1 ? 'page' : 'pages'})`);
  }

  await page.emulateMedia({ media: 'screen', colorScheme: 'light' });
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto(`${origin}${BASE}/og/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'dist/og.png' });
  console.log('dist/og.png');
} finally {
  await browser.close();
  astro('stop');
}
