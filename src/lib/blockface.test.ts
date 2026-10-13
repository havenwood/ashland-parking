import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockFace, chain } from './blockface.ts';
import type { Position } from './project.ts';

const p = (x: number): Position => [x, 0];

test('chains ways that meet end to end, in either direction', () => {
  assert.deepEqual(chain([[p(2), p(3)], [p(0), p(1), p(2)], [p(4), p(3)]]), [[p(0), p(1), p(2), p(3), p(4)]]);
});

test('keeps disconnected ways apart', () => {
  assert.equal(chain([[p(0), p(1)], [p(5), p(6)]]).length, 2);
});

test('slices the street between its two cross streets', () => {
  const main = [[p(0), p(1), p(2)], [p(2), p(3), p(4)]];
  const first: Position[][] = [[[1, -1], p(1), [1, 1]]];
  const second: Position[][] = [[[3, 1], p(3)]];
  assert.deepEqual(blockFace(main, first, second), [p(1), p(2), p(3)]);
  assert.deepEqual(blockFace(main, second, first), [p(1), p(2), p(3)]);
});

test('falls back to where the lines cross when a junction has no shared node', () => {
  const main = [[p(0), p(1), p(2), p(3)]];
  const shared: Position[][] = [[[1, -1], p(1)]];
  const crossing: Position[][] = [[[2.5, -1], [2.5, 1]]];
  assert.deepEqual(blockFace(main, shared, crossing), [p(1), p(2), p(2.5)]);
  assert.deepEqual(blockFace(main, crossing, shared), [p(1), p(2), p(2.5)]);
});

test('fails loudly when the streets never meet', () => {
  assert.throws(() => blockFace([[p(0), p(1)]], [[[9, 9]]], [[p(1)]]));
});
