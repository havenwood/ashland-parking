import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GARAGE, garageSavings, moves, timecard } from './shift.ts';

test('an 8-hour shift on a 2-hour street goes from 3 moves to 1', () => {
  assert.deepEqual(moves(8, 'street'), { today: 3, withPass: 1 });
});

test('a shift within the limit needs no moves', () => {
  assert.deepEqual(moves(2, 'street'), { today: 0, withPass: 0 });
  assert.deepEqual(moves(4, 'lot'), { today: 0, withPass: 0 });
});

test('partial periods round up', () => {
  assert.deepEqual(moves(5, 'street'), { today: 2, withPass: 1 });
  assert.deepEqual(moves(9, 'lot'), { today: 2, withPass: 1 });
});

test('the garage has no time limit to move for', () => {
  assert.deepEqual(moves(10, 'garage'), { today: 0, withPass: 0 });
});

test('garage savings use 52 weeks of workdays', () => {
  assert.deepEqual(garageSavings(5), { daily: 715, lease: 360 });
  assert.deepEqual(garageSavings(1), { daily: 143, lease: 360 });
});

test('the monthly garage pass is a year of months', () => {
  assert.equal(GARAGE.leaseMonthly * 12, GARAGE.leaseYearly);
});

test('a time card punches each move: 8 hours on a 2-hour street', () => {
  assert.deepEqual(timecard(8, 'street'), [
    { hour: 0, today: 'in', withPass: 'in' },
    { hour: 2, today: 'move', withPass: undefined },
    { hour: 4, today: 'move', withPass: 'move' },
    { hour: 6, today: 'move', withPass: undefined },
    { hour: 8, today: 'out', withPass: 'out' },
  ]);
});

test('a time card agrees with the move count for every shift', () => {
  for (const spot of ['street', 'lot', 'garage'] as const) {
    for (let hours = 1; hours <= 14; hours += 0.5) {
      const card = timecard(hours, spot);
      const { today, withPass } = moves(hours, spot);
      assert.equal(card.filter((row) => row.today === 'move').length, today, `${hours} hours, ${spot}`);
      assert.equal(card.filter((row) => row.withPass === 'move').length, withPass, `${hours} hours, ${spot}`);
      assert.equal(card.at(-1)!.hour, hours);
    }
  }
});
