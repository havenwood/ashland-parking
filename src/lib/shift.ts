/** Where a downtown worker parks today. */
export type Spot = 'street' | 'lot' | 'garage';

/** Posted time limit in hours; the garage has none. */
export const LIMIT_HOURS: Record<Spot, number> = { street: 2, lot: 4, garage: Infinity };

/** Hargadine garage costs, in dollars. Sources are cited where these are displayed. */
export const GARAGE = { daily: 2.75, leaseMonthly: 30, leaseYearly: 360 } as const;

export const WEEKS_PER_YEAR = 52;

/** Times a worker must move their car during one shift, today and with the pass's doubled limit. */
export function moves(shiftHours: number, spot: Spot): { today: number; withPass: number } {
  const count = (limit: number) => Math.max(0, Math.ceil(shiftHours / limit) - 1);
  const limit = LIMIT_HOURS[spot];
  return { today: count(limit), withPass: count(limit * 2) };
}

/** Yearly garage savings with the pass, versus paying daily or holding a monthly lease. */
export function garageSavings(daysPerWeek: number): { daily: number; lease: number } {
  return {
    daily: Math.round(GARAGE.daily * daysPerWeek * WEEKS_PER_YEAR),
    lease: GARAGE.leaseYearly,
  };
}

/** What happens at one row of a time card: clock in, move the car, clock out, or nothing. */
export type Punch = 'in' | 'move' | 'out' | undefined;

/**
 * One shift as a time card: clocking in, every hour a move falls due today, and clocking out.
 * The pass's moves fall on the same hours, since its limit is twice today's.
 */
export function timecard(shiftHours: number, spot: Spot): { hour: number; today: Punch; withPass: Punch }[] {
  const limit = LIMIT_HOURS[spot];
  const due: number[] = [];
  for (let hour = limit; hour < shiftHours; hour += limit) due.push(hour);
  return [
    { hour: 0, today: 'in', withPass: 'in' },
    ...due.map((hour, index) => ({ hour, today: 'move' as const, withPass: index % 2 ? 'move' as const : undefined })),
    { hour: shiftHours, today: 'out', withPass: 'out' },
  ];
}
