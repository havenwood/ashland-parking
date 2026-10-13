import type { Locale } from '../i18n/strings.ts';

type Text = Record<Locale, string>;

/** One photograph: where it came from, its license and what we changed. */
export interface Photo {
  /** The source's own title for the work. */
  title: string;
  author: string;
  /** Year the photo was taken. */
  year: number;
  /** The file page the photo came from. */
  source: string;
  license: { name: Text; url: string };
  /** What we changed, for the credit line. */
  changes: Text;
  /** Short place name for the footer's credit line. */
  place: Text;
}

/**
 * Photos of downtown Ashland, Oregon. Public domain or CC0 only, so no attribution or share-alike
 * terms attach; they are page backdrop, credited in the footer. Every source was checked on its
 * file page; sources are the original uploads at full size.
 */
export const photos = {
  eastMain: {
    title: 'Ashland-springs-hotel Ashland Oregon',
    author: 'Seattleretro',
    year: 2009,
    source: 'https://commons.wikimedia.org/wiki/File:Ashland-springs-hotel_Ashland_Oregon.JPG',
    license: {
      name: { en: 'public domain', es: 'dominio público' },
      url: 'https://commons.wikimedia.org/wiki/Template:PD-self',
    },
    changes: {
      en: 'Cropped, printed in two inks, license plates blurred.',
      es: 'Recortada, impresa en dos tintas, placas difuminadas.',
    },
    place: { en: 'East Main Street', es: 'East Main Street' },
  },
  plaza: {
    title: 'IOOF Building - Ashland, Oregon - DSC02708',
    author: 'Daderot',
    year: 2013,
    source: 'https://commons.wikimedia.org/wiki/File:IOOF_Building_-_Ashland,_Oregon_-_DSC02708.JPG',
    license: {
      name: { en: 'CC0 1.0', es: 'CC0 1.0' },
      url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    changes: {
      en: 'Cropped, printed in two inks, license plates blurred.',
      es: 'Recortada, impresa en dos tintas, placas difuminadas.',
    },
    place: { en: 'The Plaza', es: 'La Plaza' },
  },
} satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;

/** Labels for the footer's credits, kept here so photo strings live in one place. */
export const photoText: Record<Locale, { credits: string; by: string }> = {
  en: { credits: 'Photo credits', by: 'by' },
  es: { credits: 'Créditos de las fotos', by: 'de' },
};
