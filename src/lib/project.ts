export type Position = [lon: number, lat: number];
export type Bbox = [west: number, south: number, east: number, north: number];

/**
 * Equirectangular projection scaled by cos(latitude), which is accurate to well under
 * a pixel across a few downtown blocks. Returns SVG coordinates with y pointing down.
 */
export function projector(bbox: Bbox, width: number) {
  const [west, south, east, north] = bbox;
  const xScale = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const scale = width / ((east - west) * xScale);
  const height = (north - south) * scale;
  const point = ([lon, lat]: Position): [number, number] => [
    round((lon - west) * xScale * scale),
    round((north - lat) * scale),
  ];
  const path = (line: Position[], closed = false) =>
    line.map((position, index) => `${index ? 'L' : 'M'}${point(position).join(' ')}`).join('') + (closed ? 'Z' : '');
  /** SVG units in one meter on the ground, for a scale bar. */
  const unitsPerMeter = scale / metersPerDegree((south + north) / 2);
  return { width, height: round(height), point, path, unitsPerMeter };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Meters in one degree of latitude at a latitude (the standard WGS 84 series). */
function metersPerDegree(lat: number) {
  const phi = (lat * Math.PI) / 180;
  return 111132.92 - 559.82 * Math.cos(2 * phi) + 1.175 * Math.cos(4 * phi);
}
