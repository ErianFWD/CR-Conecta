import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRequestLimits } from './limits.js';

test('valid categories honor their configured per-request thresholds', () => {
  assert.equal(checkRequestLimits('Alimentos sellados', 20).exceeded, false);
  assert.equal(checkRequestLimits('Alimentos sellados', 21).exceeded, true);
});

test('active requests count toward the recurrence threshold', () => {
  const recentDate = daysAgo(20);
  const oldDate = daysAgo(90);
  const previous = [
    { category: 'Alimentos sellados', amount: 15, status: 'Aprobada', date: recentDate },
    { category: 'Alimentos sellados', amount: 10, status: 'En revisión', date: recentDate },
    { category: 'Alimentos sellados', amount: 100, status: 'Denegada', date: recentDate },
    { category: 'Alimentos sellados', amount: 100, status: 'Aprobada', date: oldDate }
  ];
  assert.equal(checkRequestLimits('Alimentos sellados', 16, previous).exceeded, true);
  assert.equal(checkRequestLimits('Alimentos sellados', 5, previous).exceeded, false);
});

test('unknown categories and invalid quantities fail closed', () => {
  assert.equal(checkRequestLimits('Categoría desconocida', 1).exceeded, true);
  assert.equal(checkRequestLimits('Alimentos sellados', 0).exceeded, true);
  assert.equal(checkRequestLimits('Alimentos sellados', Number.NaN).exceeded, true);
});

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
