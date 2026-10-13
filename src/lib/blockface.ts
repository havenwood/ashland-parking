import type { Position } from './project.ts';

const key = ([lon, lat]: Position) => `${lon},${lat}`;

/** Joins ways that share endpoints into the longest possible chains. */
export function chain(lines: Position[][]): Position[][] {
  const pending = lines.map((line) => [...line]);
  const chains: Position[][] = [];
  while (pending.length) {
    let current = pending.shift()!;
    let grew = true;
    while (grew) {
      grew = false;
      for (const [index, line] of pending.entries()) {
        const [head, tail] = [key(current[0]), key(current.at(-1)!)];
        const [start, end] = [key(line[0]), key(line.at(-1)!)];
        const joined =
          tail === start ? [...current, ...line.slice(1)] :
          tail === end ? [...current, ...line.slice(0, -1).reverse()] :
          head === end ? [...line, ...current.slice(1)] :
          head === start ? [...line.slice(1).reverse(), ...current] :
          null;
        if (joined) {
          current = joined;
          pending.splice(index, 1);
          grew = true;
          break;
        }
      }
    }
    chains.push(current);
  }
  return chains;
}

/** Where a cross street meets a line: a fractional index along it, and the point. */
type Crossing = { at: number; point: Position };

/** Where segments p1–p2 and q1–q2 cross, as a fraction along p1–p2, or null. */
function cross([x1, y1]: Position, [x2, y2]: Position, [x3, y3]: Position, [x4, y4]: Position): number | null {
  const denominator = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (!denominator) return null;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / denominator;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null;
}

/** Where `streets` meet `line` at a shared node, which is how OSM marks a junction. */
function junction(line: Position[], streets: Position[][]): Crossing | null {
  const nodes = new Set(streets.flat().map(key));
  const shared = line.findIndex((position) => nodes.has(key(position)));
  return shared === -1 ? null : { at: shared, point: line[shared] };
}

/** A junction, or failing that where the drawn lines cross (a few junctions lack a node). */
function crossing(line: Position[], streets: Position[][]): Crossing | null {
  const shared = junction(line, streets);
  if (shared) return shared;
  for (let index = 1; index < line.length; index++) {
    for (const street of streets) {
      for (let other = 1; other < street.length; other++) {
        const t = cross(line[index - 1], line[index], street[other - 1], street[other]);
        if (t === null) continue;
        const [[x1, y1], [x2, y2]] = [line[index - 1], line[index]];
        return { at: index - 1 + t, point: [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t] };
      }
    }
  }
  return null;
}

/**
 * The stretch of `street` between its intersections with `from` and `to`. Shared
 * nodes win; crossing lines are the fallback, tried only when no chain has both.
 */
export function blockFace(street: Position[][], from: Position[][], to: Position[][]): Position[] {
  const chains = chain(street);
  for (const find of [junction, crossing]) {
    for (const line of chains) {
      const [start, end] = [find(line, from), find(line, to)];
      if (!start || !end) continue;
      const [first, last] = start.at <= end.at ? [start, end] : [end, start];
      return [first.point, ...line.slice(Math.floor(first.at) + 1, Math.ceil(last.at)), last.point];
    }
  }
  throw new Error('No block face: the streets never meet in the OSM data.');
}
