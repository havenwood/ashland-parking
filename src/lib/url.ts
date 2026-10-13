/** A site path under the configured base, e.g. withBase('bill/print/') → '/ashland-parking/bill/print/'. */
export const withBase = (path: string): string =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
