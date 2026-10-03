import assert from 'node:assert/strict';
import { test } from 'node:test';
import { projector } from './project.ts';

const bbox: [number, number, number, number] = [-122.72, 42.19, -122.70, 42.20];

test('corners map to the edges of the viewBox', () => {
  const { point, width, height } = projector(bbox, 1000);
  assert.deepEqual(point([-122.72, 42.20]), [0, 0]);
  assert.deepEqual(point([-122.70, 42.19]), [width, height]);
});

test('longitude is compressed by cos(latitude)', () => {
  const { height } = projector(bbox, 1000);
  // 0.02° of longitude at ~42.195°N is about 0.741 × 0.02° of latitude.
  assert.ok(Math.abs(height - 1000 * (0.01 / (0.02 * Math.cos((42.195 * Math.PI) / 180)))) < 0.2);
});

test('unitsPerMeter matches the ground distance a degree of latitude spans', () => {
  const { height, unitsPerMeter } = projector(bbox, 1000);
  // 0.01° of latitude at ~42.195°N is about 1,110.8 m.
  assert.ok(Math.abs(height / unitsPerMeter - 1110.8) < 1);
});

test('paths use absolute move and line commands', () => {
  const { path } = projector(bbox, 1000);
  assert.equal(path([[-122.72, 42.20], [-122.70, 42.20]], true), 'M0 0L1000 0Z');
});
