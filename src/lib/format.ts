/** Replaces each {name} in a template with its value. */
export const fill = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => (name in values ? String(values[name]) : match));

/** Whole US dollars in the reader's language, e.g. "$715". */
export const money = (dollars: number, locale: string): string =>
  new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: dollars % 1 ? 2 : 0,
  }).format(dollars);

/** A count in its plural form, e.g. { one: '{n} day', other: '{n} days' }, with {n} filled in. */
export const plural = (forms: Record<string, string>, count: number, locale: string): string =>
  fill(forms[new Intl.PluralRules(locale).select(count)] ?? forms.other, { n: count.toLocaleString(locale) });
