import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fill, money, plural } from './format.ts';

test('fill replaces known names and leaves unknown ones', () => {
  assert.equal(fill('{a} and {b}', { a: 1 }), '1 and {b}');
});

test('money shows whole dollars, and cents only when needed', () => {
  assert.equal(money(715, 'en'), '$715');
  assert.equal(money(2.75, 'en'), '$2.75');
  assert.equal(money(360, 'es'), '$360');
});

test('plural picks the form for the count', () => {
  const days = { one: '{n} day', other: '{n} days' };
  assert.equal(plural(days, 1, 'en'), '1 day');
  assert.equal(plural(days, 5, 'en'), '5 days');
  assert.equal(plural({ one: '{n} día', other: '{n} días' }, 1, 'es'), '1 día');
});
