/** Splits a shift into the stretches between car moves: [startHour, endHour][]. */
export function stretches(shiftHours: number, limitHours: number): [number, number][] {
  const result: [number, number][] = [];
  for (let start = 0; start < shiftHours; start += limitHours) {
    result.push([start, Math.min(start + limitHours, shiftHours)]);
  }
  return result;
}

const WIDTH = 640;
const HEIGHT = 20;
const GAP = 12;

/**
 * One row of the shift strip as SVG: a bar broken at each move, with a dot in each break.
 * Decorative; the surrounding text carries the numbers for assistive tech.
 */
export function stripSvg(shiftHours: number, limitHours: number): string {
  const x = (hour: number) => (hour / shiftHours) * WIDTH;
  const parts = stretches(shiftHours, limitHours);
  const bars = parts.map(([start, end], index) => {
    const left = x(start) + (index === 0 ? 0 : GAP / 2);
    const right = x(end) - (index === parts.length - 1 ? 0 : GAP / 2);
    return `<rect class="stretch" x="${left.toFixed(1)}" y="2" width="${(right - left).toFixed(1)}" height="${HEIGHT - 4}" rx="3"/>`;
  });
  const dots = parts.slice(1).map(([start]) =>
    `<circle class="move" cx="${x(start).toFixed(1)}" cy="${HEIGHT / 2}" r="4.5"/>`);
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${bars.join('')}${dots.join('')}</svg>`;
}
