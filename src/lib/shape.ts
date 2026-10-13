/**
 * Planar helpers for drawing OSM ground features (streets, buildings, water) in
 * SVG user units: clip to the view, drop sub-pixel detail, and write short paths.
 */
export type Point = [x: number, y: number];
export type Box = [minX: number, minY: number, maxX: number, maxY: number];

const lerp = ([x1, y1]: Point, [x2, y2]: Point, t: number): Point => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];

function distanceToSegment([x, y]: Point, [x1, y1]: Point, [x2, y2]: Point) {
  const [dx, dy] = [x2 - x1, y2 - y1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length)) : 0;
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

/** Douglas–Peucker: keeps only the points that bend the line by more than `tolerance`. */
export function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const [first, last] = [points[0], points.at(-1)!];
  let [farthest, distance] = [0, 0];
  for (let index = 1; index < points.length - 1; index++) {
    const offset = distanceToSegment(points[index], first, last);
    if (offset > distance) [farthest, distance] = [index, offset];
  }
  if (distance <= tolerance) return [first, last];
  return [...simplify(points.slice(0, farthest + 1), tolerance).slice(0, -1), ...simplify(points.slice(farthest), tolerance)];
}

/** The area of a ring, by the shoelace formula. */
export function area(ring: Point[]): number {
  let sum = 0;
  for (const [index, [x1, y1]] of ring.entries()) {
    const [x2, y2] = ring[(index + 1) % ring.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** Sutherland–Hodgman: the part of a ring inside a box, as an open ring. */
export function clipRing(ring: Point[], [minX, minY, maxX, maxY]: Box): Point[] {
  const edges: [inside: (point: Point) => boolean, cross: (a: Point, b: Point) => Point][] = [
    [([x]) => x >= minX, (a, b) => lerp(a, b, (minX - a[0]) / (b[0] - a[0]))],
    [([x]) => x <= maxX, (a, b) => lerp(a, b, (maxX - a[0]) / (b[0] - a[0]))],
    [([, y]) => y >= minY, (a, b) => lerp(a, b, (minY - a[1]) / (b[1] - a[1]))],
    [([, y]) => y <= maxY, (a, b) => lerp(a, b, (maxY - a[1]) / (b[1] - a[1]))],
  ];
  const [first, last] = [ring[0], ring.at(-1)!];
  let points = first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
  for (const [inside, cross] of edges) {
    const input = points;
    points = [];
    for (const [index, current] of input.entries()) {
      const previous = input.at(index - 1)!;
      if (inside(current) !== inside(previous)) points.push(cross(previous, current));
      if (inside(current)) points.push(current);
    }
  }
  return points;
}

/** Liang–Barsky: whether any part of the segment from a to b lies in the box. */
function touches([x1, y1]: Point, [x2, y2]: Point, [minX, minY, maxX, maxY]: Box) {
  const [dx, dy] = [x2 - x1, y2 - y1];
  let [enter, leave] = [0, 1];
  for (const [p, q] of [[-dx, x1 - minX], [dx, maxX - x1], [-dy, y1 - minY], [dy, maxY - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const t = q / p;
    if (p < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter > leave) return false;
  }
  return true;
}

/** The runs of a polyline whose segments pass through a box (each run keeps its outside ends). */
export function clipLine(line: Point[], box: Box): Point[][] {
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (let index = 1; index < line.length; index++) {
    if (touches(line[index - 1], line[index], box)) {
      if (!run.length) run.push(line[index - 1]);
      run.push(line[index]);
    } else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

/** Numbers joined the short way SVG allows: a minus sign separates as well as a space. */
const numbers = (values: number[]) => values.reduce<string>((text, value, index) => text + (index && value >= 0 ? ' ' : '') + value, '');

/**
 * Path data in whole units: an absolute move, then relative lines, and `z` for rings.
 * About half the length of absolute decimals; a unit is under a pixel on a desktop map.
 */
export function compact(lines: Point[][], closed = false): string {
  return lines
    .map((line) => {
      const points = line.map(([x, y]) => [Math.round(x), Math.round(y)]);
      let [x0, y0] = points[0];
      const deltas: number[] = [];
      for (const [x, y] of points.slice(1)) {
        if (x === x0 && y === y0) continue;
        deltas.push(x - x0, y - y0);
        [x0, y0] = [x, y];
      }
      if (closed && deltas.length >= 2 && x0 === points[0][0] && y0 === points[0][1]) deltas.splice(-2);
      if (deltas.length < (closed ? 4 : 2)) return '';
      return `M${numbers(points[0])}l${numbers(deltas)}${closed ? 'z' : ''}`;
    })
    .join('');
}
