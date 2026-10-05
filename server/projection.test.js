import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCampaign } from './projection.js';

const input = { category: 'Vestimenta', goal: 30, weeks: 3 };

test('projection uses summarized campaign data and produces graph-ready weekly values', async () => {
  let sent;
  const result = await projectCampaign({
    input,
    campaigns: [{ name: 'Nombre privado', companyId: 'private-id', category: 'Vestimenta', goal: 20, progress: 8, start: '2026-09-01' }],
    donations: [{ donorId: 'private-id', donorName: 'Nombre privado', category: 'Vestimenta', quantity: 4 }],
    apiKey: 'test-secret', model: 'test-model',
    fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ summary: 'Ritmo aproximado.', assumptions: ['Historial incompleto.'], weeklyUnits: [3, 4, 5] }) } }] }) };
    }
  });
  assert.deepEqual(result.weeklyUnits, [3, 4, 5]);
  assert.equal(result.observedCampaigns, 1);
  assert.equal(sent.model, 'test-model');
  assert.doesNotMatch(JSON.stringify(sent), /Nombre privado|private-id/);
});

test('projection rejects invalid inputs and malformed or excessive model output', async () => {
  await assert.rejects(projectCampaign({ input: { ...input, weeks: 13 }, apiKey: 'test-secret' }), error => error.status === 400);
  await assert.rejects(projectCampaign({ input, apiKey: '' }), error => error.status === 503);
  await assert.rejects(projectCampaign({
    input, campaigns: [], donations: [], apiKey: 'test-secret',
    fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"summary":"Demasiado","weeklyUnits":[20,20,20]}' } }] }) })
  }), error => error.status === 502);
});
