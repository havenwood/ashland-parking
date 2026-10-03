# Ashland Downtown Worker Parking Pass

A proposal site and draft ordinance (new AMC 11.26.105) for the Ashland City Council.
Live at <https://shannonskipper.com/ashland-parking/>. **Draft, not adopted.**

A proposal from Shannon Skipper, an Ashland local, and resident Alex Brinkman. Facts as of October 2, 2026.

## Run it

Node 24 or newer.

```sh
npm install
npx playwright install chromium
npm run dev         # astro dev
npm run build       # site, then the bill/memo/flyer PDFs and og.png via Playwright
npm test            # unit tests (node --test) and Playwright: smoke, axe, no-JS, calculator
npm run typecheck   # astro-check on the site code
npm run fetch-osm   # refresh data/downtown.geojson (committed, and CI never fetches)
```

## Where things live

| What | Where |
| --- | --- |
| The bill (source of truth for the web page, `/bill/print/` and the PDF) | `src/content/ordinance.md` |
| Plain-English notes, all UI copy (English, Spanish draft) | `src/i18n/en.ts`, `src/i18n/es.ts` |
| Every cited source, with blocked/archived flags | `src/data/sources.ts` |
| Hand-annotated time limits (approximate) | `data/limits.json` |
| OpenStreetMap extract | `data/downtown.geojson` |
| Calculator, strip, map and bill logic (unit-tested) | `src/lib/` |

## Decisions

- **Ordinance format.** Follows Ord. 3306 (August 4, 2026), the newest codified ordinance. It
  skips Ord. 3192, the 2020 City Manager housekeeping ordinance, which touched 11.26 only through
  its codification clause. Ashland uses “Reviewed as to form” and shows additions bold underlined.
  The codification clause in 3306 names “Sections 3-5” in a four-section ordinance. This draft
  names its own boilerplate sections correctly.
- **Garage prices.** $2.75 covers 6 a.m. to 6 p.m. The monthly pass is $30 on the City’s parking
  page and at LAZ Parking, but $40 in the Council-adopted FY27 fee schedule. The site uses $30
  ($360 a year) and cites both.
- **Visual style.** Modern civic, sign-green ("Permit"). Parking signs that allow parking are
  green on white and those that forbid it are red on white (MUTCD §2B.53). So the pass is sign
  green (`#026256`, `#30cfb7` at night) and today's 2-hour squeeze is vermilion, on a blue-white
  page with spruce ink. Four hours is blue, the garage that's free by day is amber, and paid or
  uncovered parking is neutral. Everything is flat: no gradients or shadows, one small radius.
  Quiet surfaces rest on blue-gray, and color arrives where the pass applies. The calculator
  turns mint as savings grow, and so do the map in its pass view and the "you'd qualify" card.
  Tokens are named for their role (`--primary`, `--today`, `--hours-4`, `--go`, `--neutral`)
  in `src/styles/global.css`. They are `light-dark()` OKLCH values with a `prefers-contrast: more`
  set, checked to 4.5:1 for text and 3:1 for graphics in both themes.
- **Markdown.** A small, tested renderer (`src/lib/bill.ts`) parses the bill in place of Markdown
  plugins, so defined terms become popover buttons with no extra dependencies.
- **Typecheck.** Pinned to TypeScript 6, since `@astrojs/check` 0.9.10 doesn’t support
  TypeScript 7 yet. Node-run files (scripts, tests) are left out because typing them needs
  `@types/node`, which the dependency budget doesn’t include. They run on every build and test
  instead.
- **Astro 7 compiler bug.** A template literal nested in an arrow function inside `${}` in
  frontmatter misparses. `src/components/Bill.astro` works around it.

## Links that refuse automated checks

These work in a browser but return a bot challenge or 403 to scripts:

- `ashland.municipal.codes` (all pages): Cloudflare challenge.
- `cityofdavis.org` and `santacruzca.gov`: 403 to scripts.
- The City’s link to the 2015 parking plan is dead, so the site links an Internet Archive copy.

## Data

Streets, building footprints, Ashland Creek and landmarks © OpenStreetMap contributors, ODbL 1.0.
The extract is read only at build time and clipped to the map’s view. Overpass was unreachable from the
build machine, so `fetch-osm.ts` fell back to the OSM API’s bounding-box call. The output is the
same shape either way.

## Photo credits

Both photos are public domain or CC0, so no attribution or share-alike terms apply. They are page
backdrop: decorative (empty alt), with no caption. Credits live only in the footer’s “Photo credits”
list, from `src/data/photos.ts`.

| Photo | Author, year | License | Source |
| --- | --- | --- | --- |
| East Main Street, looking west to the Ashland Springs Hotel | Seattleretro, 2009 | Public domain ([PD-self](https://commons.wikimedia.org/wiki/Template:PD-self)) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ashland-springs-hotel_Ashland_Oregon.JPG) |
| The IOOF Building (1879) on the Plaza | Daderot, 2013 | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:IOOF_Building_-_Ashland,_Oregon_-_DSC02708.JPG) |

**Adapted.** Each was cropped from the full-size original, license plates were blurred, and it was
printed twice in the page’s own inks so its edges fall away into the page:

- **Light** (`plaza.jpg`): grayscale mapped from the soft ink (`#475861`) to the page paper
  (`#f8fbfe`), laid on the page with `mix-blend-mode: multiply`.
- **Dark** (`plaza-dark.jpg`): the night paper (`#0f171f`) up to a quiet gray (`#687686`), so
  it never turns into a bright slab.

The East Main photo uses a red-weighted gray, like a red filter on film, so the sky darkens behind
the tower. A `<picture>` source picks the dark print under `prefers-color-scheme: dark`, and a
feathered `mask-image` softens every edge. The committed JPEGs in `src/assets/photos/` are the
outputs; Astro makes the AVIF and WebP sizes at build. To redo one, with ImageMagick 7 (plaza
shown, light print; plate boxes are in original-pixel coordinates):

```sh
magick -size 1x256 gradient:'#475861'-'#f8fbfe' clut.png
magick IOOF_Building_-_Ashland,_Oregon_-_DSC02708.JPG \
  -region 170x95+830+3080 -blur 0x14 -region 140x90+2125+3040 -blur 0x14 \
  -region 110x85+3090+3115 -blur 0x14 +region \
  -crop 4832x3221+320+400 +repage -resize 1280x853 -modulate 100,0 -type TrueColor \
  -level 2%,98% -sigmoidal-contrast 2.5,50% clut.png -clut -strip -quality 90 plaza.jpg
```

For the dark print, build the ramp with `gradient:'#0f171f'-'#687686'` and write `plaza-dark.jpg`.
East Main uses `-color-matrix '0.7 0.25 0.05 0.7 0.25 0.05 0.7 0.25 0.05'` in place of
`-modulate 100,0`, crop `2304x2304+0+420`, size `1280x1280`, and one plate box `90x52+2145+2540`.
