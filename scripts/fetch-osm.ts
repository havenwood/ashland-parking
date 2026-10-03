/**
 * Fetches downtown Ashland geometry from OpenStreetMap and writes
 * data/downtown.geojson. Run by hand; the output is committed.
 *
 *   node scripts/fetch-osm.ts
 *
 * Uses one Overpass query. If Overpass is unreachable, falls back to the OSM API's
 * bounding-box call and applies the same filter locally.
 *
 * Data © OpenStreetMap contributors, ODbL 1.0.
 */
import { writeFile } from 'node:fs/promises';

type Tags = Record<string, string>;
type LatLon = { lat: number; lon: number };
type Shape = { id: string; tags: Tags; lines: LatLon[][] };

/** south, west, north, east */
const BBOX = [42.1928, -122.7192, 42.2016, -122.7066] as const;
const ROADS = /^(primary|secondary|tertiary|residential|unclassified|living_street|pedestrian)$/;
const PARKS = /^(Lithia Park|Calle Guanajuato)$/;
const WATER = /^(stream|river)$/;
const USER_AGENT = 'ashland-parking-site/1.0 (https://shannonskipper.com/ashland-parking)';

const wanted = (tags: Tags = {}) =>
  ROADS.test(tags.highway ?? '') ||
  tags.place === 'square' ||
  tags.amenity === 'parking' ||
  (tags.leisure === 'park' && PARKS.test(tags.name ?? '')) ||
  WATER.test(tags.waterway ?? '') ||
  'building' in tags;

/** Building footprints are background texture: keep only what the map can label. */
const slim = (tags: Tags): Tags => {
  if (!('building' in tags) || tags.amenity === 'parking') return tags;
  const { building, name, amenity } = tags;
  return { building, ...(name && { name }), ...(amenity && { amenity }) };
};

async function fromOverpass(): Promise<Shape[]> {
  const box = BBOX.join(',');
  const query = `[out:json][timeout:60];
(
  way["highway"~"${ROADS.source}"](${box});
  nwr["place"="square"](${box});
  nwr["amenity"="parking"](${box});
  nwr["leisure"="park"]["name"~"${PARKS.source}"];
  way["waterway"~"${WATER.source}"](${box});
  nwr["building"](${box});
);
out geom;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'user-agent': USER_AGENT },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Overpass ${response.status}`);
  const { elements } = await response.json();
  return elements
    .filter((element: { type: string }) => element.type !== 'node')
    .map((element: any): Shape => ({
      id: `${element.type}/${element.id}`,
      tags: element.tags ?? {},
      lines: element.type === 'way'
        ? [element.geometry]
        : element.members.filter((member: any) => member.role === 'outer' && member.geometry).map((member: any) => member.geometry),
    }));
}

async function fromOsmApi(): Promise<Shape[]> {
  const [south, west, north, east] = BBOX;
  const url = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${west},${south},${east},${north}`;
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok) throw new Error(`OSM API ${response.status}`);
  const { elements } = await response.json();
  const nodes = new Map<number, LatLon>();
  const ways = new Map<number, number[]>();
  for (const element of elements) {
    if (element.type === 'node') nodes.set(element.id, { lat: element.lat, lon: element.lon });
    if (element.type === 'way') ways.set(element.id, element.nodes);
  }
  const line = (refs: number[]) => refs.map((ref) => nodes.get(ref)).filter((point) => point !== undefined);
  return elements
    .filter((element: any) => element.type !== 'node' && wanted(element.tags))
    .map((element: any): Shape => ({
      id: `${element.type}/${element.id}`,
      tags: element.tags,
      lines: element.type === 'way'
        ? [line(element.nodes)]
        : element.members
            .filter((member: any) => member.type === 'way' && member.role === 'outer' && ways.has(member.ref))
            .map((member: any) => line(ways.get(member.ref)!)),
    }));
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;
const coords = (points: LatLon[]) => points.map(({ lat, lon }) => [round(lon), round(lat)]);
const isClosed = (points: LatLon[]) =>
  points.length > 3 && points[0].lat === points.at(-1)!.lat && points[0].lon === points.at(-1)!.lon;

function toFeature({ id, tags, lines }: Shape) {
  const [first] = lines;
  const geometry = lines.length !== 1
    ? { type: 'MultiLineString', coordinates: lines.map(coords) }
    : isClosed(first) && !tags.highway
      ? { type: 'Polygon', coordinates: [coords(first)] }
      : { type: 'LineString', coordinates: coords(first) };
  return { type: 'Feature', properties: { id, ...slim(tags) }, geometry };
}

let source = 'Overpass API';
let shapes: Shape[];
try {
  shapes = await fromOverpass();
} catch (error) {
  console.warn(`Overpass unavailable (${(error as Error).message}); using the OSM API bounding-box call.`);
  source = 'OpenStreetMap API';
  shapes = await fromOsmApi();
}

const collection = {
  type: 'FeatureCollection',
  attribution: '© OpenStreetMap contributors (ODbL 1.0)',
  source,
  fetched: new Date().toISOString().slice(0, 10),
  bbox: [BBOX[1], BBOX[0], BBOX[3], BBOX[2]],
  features: shapes.filter((shape) => shape.lines.some((line) => line.length > 1)).map(toFeature),
};
await writeFile(new URL('../data/downtown.geojson', import.meta.url), `${JSON.stringify(collection)}\n`);
console.log(`Wrote ${collection.features.length} features from ${source}.`);
