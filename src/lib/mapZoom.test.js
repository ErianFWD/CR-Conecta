import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_MAP_ZOOM, getMapBounds } from './mapZoom.js';

test('map bounds shrink on zoom in and remain centered on the selected zone', () => {
  const zone = { lat: 9.9763, lon: -84.8384 };
  const defaultBounds = getMapBounds(zone, DEFAULT_MAP_ZOOM).split(',').map(Number);
  const closeBounds = getMapBounds(zone, DEFAULT_MAP_ZOOM + 1).split(',').map(Number);
  const farBounds = getMapBounds(zone, DEFAULT_MAP_ZOOM - 1).split(',').map(Number);
  assert.ok(closeBounds[2] - closeBounds[0] < defaultBounds[2] - defaultBounds[0]);
  assert.ok(farBounds[2] - farBounds[0] > defaultBounds[2] - defaultBounds[0]);
  assert.ok(Math.abs((closeBounds[0] + closeBounds[2]) / 2 - zone.lon) < 1e-9);
  assert.ok(Math.abs((closeBounds[1] + closeBounds[3]) / 2 - zone.lat) < 1e-9);
});
