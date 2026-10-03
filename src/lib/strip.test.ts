import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stretches, stripSvg } from './strip.ts';

test('an 8-hour shift with a 2-hour limit has four stretches', () => {
  assert.deepEqual(stretches(8, 2), [[0, 2], [2, 4], [4, 6], [6, 8]]);
});

test('the last stretch is cut short by the end of the shift', () => {
  assert.deepEqual(stretches(5, 2), [[0, 2], [2, 4], [4, 5]]);
});

test('no time limit means one unbroken stretch', () => {
  assert.deepEqual(stretches(8, Infinity), [[0, 8]]);
});

test('the SVG draws one dot per move', () => {
  const svg = stripSvg(8, 2);
  assert.equal(svg.match(/<rect/g)?.length, 4);
  assert.equal(svg.match(/<circle/g)?.length, 3);
  assert.doesNotMatch(svg, /style=/);
});
