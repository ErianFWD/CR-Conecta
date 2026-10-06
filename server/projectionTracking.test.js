import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTrackedProjection, publicTrackedProjection } from './projectionTracking.js';
import { validateImportedHistory } from './importedProjection.js';
import { projectCampaign } from './projection.js';
const record = { ownerId: 'company', scope: 'empresa', scenario: { category: 'Vestimenta', goal: 10 }, startedAt: '2026-10-01T12:00:00Z', endsAt: '2026-10-08T12:00:00Z', baselineDonationIds: ['old'] };
const donation = { id: 'new', donorId: 'company', category: 'Vestimenta', quantity: 10, createdAt: '2026-10-02T12:00:00Z', status: 'Registrada' };
test('goal is fulfilled only by actual eligible donations, never the prediction', () => {
  assert.deepEqual(evaluateTrackedProjection(record, [donation], new Date('2026-10-03')), { actual: 10, status: 'cumplida' });
  assert.equal(evaluateTrackedProjection(record, [], new Date('2026-10-03')).status, 'en_curso');
});
test('below target fails at deadline, not before, and late donations do not change failure', () => {
  assert.equal(evaluateTrackedProjection(record, [], new Date('2026-10-08T11:59:59Z')).status, 'en_curso');
  assert.equal(evaluateTrackedProjection(record, [], new Date(record.endsAt)).status, 'fallida');
  assert.equal(evaluateTrackedProjection(record, [{ ...donation, createdAt: '2026-10-09' }], new Date('2026-10-10')).status, 'fallida');
});
test('filters baseline, foreign company, cancelled, future and different category donations', () => {
  const rows = [{ ...donation, id: 'old' }, { ...donation, donorId: 'other' }, { ...donation, status: 'Cancelada' }, { ...donation, category: 'Otro' }, { ...donation, createdAt: '2026-10-07' }];
  assert.equal(evaluateTrackedProjection(record, rows, new Date('2026-10-03')).actual, 0);
  assert.equal(publicTrackedProjection(record, []).baselineDonationIds, undefined);
});
test('server validates imported histories independently from the browser', () => {
  for (const rows of [[], [{}], [{ date: '2026-02-30', category: 'Ropa', quantity: 1 }], [{ date: '2026-01-01', category: 'Ropa', quantity: -1 }]]) assert.throws(() => validateImportedHistory(rows), { status: 400 });
});
test('uploaded PDF rows change the forecast without changing platform donations', async () => {
  const donations = [{ date: '2026-10-05', category: 'Vestimenta', quantity: 100 }];
  const input = { category: 'Vestimenta', goal: 20, weeks: 2, useAI: false, importedHistory: [{ date: '2026-10-05', category: 'Vestimenta', quantity: 5 }] };
  const result = await projectCampaign({ input, donations, today: new Date('2026-10-06') });
  assert.equal(result.dataSource, 'pdf');
  assert.equal(result.history.reduce((sum, row) => sum + row.units, 0), 5);
  assert.equal(donations[0].quantity, 100);
});
