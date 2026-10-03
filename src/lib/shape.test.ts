import assert from 'node:assert/strict';
import { test } from 'node:test';
import { area, clipLine, clipRing, compact, simplify } from './shape.ts';
import type { Box, Point } from './shape.ts';

const box: Box = [0, 0, 10, 10];

test('simplify drops points that barely bend the line and keeps real corners', () => {
  assert.deepEqual(simplify([[0, 0], [5, 0.2], [10, 0]], 0.5), [[0, 0], [10, 0]]);
  assert.deepEqual(simplify([[0, 0], [5, 0.2], [10, 0], [10, 10]], 0.5), [[0, 0], [10, 0], [10, 10]]);
});

test('area is the shoelace area, either winding', () => {
  const square: Point[] = [[0, 0], [4, 0], [4, 4], [0, 4]];
  assert.equal(area(square), 16);
  assert.equal(area(square.toReversed()), 16);
});

test('clipRing keeps the part of a ring inside the box', () => {
  const half = clipRing([[-5, 0], [5, 0], [5, 10], [-5, 10], [-5, 0]], box);
  assert.equal(area(half), 50);
  assert.ok(half.every(([x, y]) => x >= 0 && x <= 10 && y >= 0 && y <= 10));
});

test('clipRing drops a ring entirely outside the box', () => {
  assert.deepEqual(clipRing([[20, 20], [30, 20], [30, 30]], box), []);
});

test('clipLine keeps each run that passes through the box, ends included', () => {
  const line: Point[] = [[-20, 5], [-10, 5], [5, 5], [20, 5], [30, 5], [30, 50], [5, 50], [5, 8], [5, -20]];
  assert.deepEqual(clipLine(line, box), [[[-10, 5], [5, 5], [20, 5]], [[5, 50], [5, 8], [5, -20]]]);
});

test('clipLine catches a segment that crosses the box with both ends outside', () => {
  assert.deepEqual(clipLine([[-5, 5], [15, 5]], box), [[[-5, 5], [15, 5]]]);
});

test('compact writes whole-unit relative paths', () => {
  assert.equal(compact([[[0.4, 0], [10.2, 0], [10, -5]]]), 'M0 0l10 0 0-5');
  assert.equal(compact([[[0, 0], [10, 0], [10, 10], [0, 0]]], true), 'M0 0l10 0 0 10z');
});

test('compact skips repeated points and shapes that round away', () => {
  assert.equal(compact([[[0, 0], [0.2, 0.1], [3, 4]]]), 'M0 0l3 4');
  assert.equal(compact([[[0, 0], [0.3, 0.2], [0.1, 0.4]]], true), '');
});
