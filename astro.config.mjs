// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  site: 'https://shannonskipper.com',
  base: '/ashland-parking',
  trailingSlash: 'always',
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-display',
      weights: ['300 800'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Georgia', 'serif'],
      options: { experimental: { variableAxis: { opsz: [['9', '144']] } } },
    },
    {
      provider: fontProviders.google(),
      name: 'Atkinson Hyperlegible Next',
      cssVariable: '--font-body',
      weights: ['400 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  security: {
    csp: {
      directives: [
        "default-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
  markdown: { syntaxHighlight: false },
});
