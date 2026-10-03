import { en } from './en.ts';
import { es } from './es.ts';

export type Locale = 'en' | 'es';
export type Strings = typeof en;

const dictionaries: Record<Locale, Strings> = { en, es };

/** UI strings for a locale. The bill itself is English-only as the official text. */
export const t = (locale: Locale): Strings => dictionaries[locale];
