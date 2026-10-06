import test from 'node:test';
import assert from 'node:assert/strict';
import { projectCampaign } from './projection.js';
import { buildForecast } from './forecast.js';

const today = new Date('2026-10-05T12:00:00Z');
const scenario = { category: 'Vestimenta', goal: 24, weeks: 4 };

// Cuatro semanas completas (ventanas de 7 días que terminan hoy) con 6 unidades cada una.
const steadyDonations = ['2026-10-01', '2026-10-03', '2026-09-25', '2026-09-27', '2026-09-18', '2026-09-20', '2026-09-11', '2026-09-13']
  .map((date, index) => ({ id: `d${index}`, donorId: `private-${index}`, donorName: 'Nombre privado', category: 'Vestimenta', quantity: 3, date }));

test('forecast derives rate, totals, confidence and probability from the site data', () => {
  const result = buildForecast({ scenario, donations: steadyDonations, today });
  assert.equal(result.forecast.weeklyRate, 6);
  assert.deepEqual(result.weeklyUnits, [6, 6, 6, 6]);
  assert.equal(result.forecast.totals.base, 24);
  assert.equal(result.forecast.goalCoverage.base, 100);
  assert.equal(result.forecast.trend, 'Estable');
  assert.equal(result.confidence.level, 'Media');
  assert.equal(result.forecast.probability, 50);
  assert.equal(result.forecast.weeksToGoal, 4);
  assert.equal(result.forecast.completionDate, '2026-11-02');
  assert.ok(result.forecast.totals.low < 24 && result.forecast.totals.high > 24);
  assert.equal(result.history.length, 4);
  assert.equal(result.history.every(week => week.units === 6), true);
});

test('forecast measures pending demand, stock and campaign schedule without counting closed requests', () => {
  const result = buildForecast({
    scenario, donations: steadyDonations, today,
    requests: [
      { category: 'Vestimenta', status: 'Aprobada', priority: 'Alta', goal: 10, received: 4 },
      { category: 'vestimenta', status: 'Aprobada', priority: 'Media', goal: 5, received: 5 },
      { category: 'Vestimenta', status: 'En revisión', goal: 7, received: 0 },
      { category: 'Vestimenta', status: 'Rechazada', goal: 50, received: 0 },
      { category: 'Calzado', status: 'Aprobada', goal: 90, received: 0 }
    ],
    inventory: [{ category: 'Vestimenta', available: 3, reserved: 1, minimum: 5 }, { category: 'Vestimenta', available: 8, reserved: 0, minimum: 2 }],
    campaigns: [{ name: 'Abrigo', category: 'Vestimenta', goal: 30, progress: 6, start: '2026-09-01', end: '2026-10-15', status: 'Activa' }]
  });
  assert.deepEqual(result.demand, { pendingUnits: 6, openRequests: 1, highPriority: 1, inReviewUnits: 7 });
  assert.equal(result.stock.free, 10);
  assert.equal(result.stock.belowMinimum, 1);
  assert.equal(result.coverage, 567);
  assert.equal(result.campaigns[0].schedule, 'Atrasada');
  assert.ok(result.insights.some(item => item.level === 'warn' && /atrasada/.test(item.text)));
  const calzado = result.outlook.find(item => item.category === 'Calzado');
  assert.equal(calzado.pendingDemand, 90);
  assert.equal(calzado.status, 'Déficit');
});

test('forecast does not invent results when the platform has no donations', () => {
  const result = buildForecast({ scenario, today });
  assert.equal(result.forecast.weeklyRate, 0);
  assert.equal(result.forecast.totals.base, 0);
  assert.equal(result.forecast.probability, null);
  assert.equal(result.forecast.weeksToGoal, null);
  assert.equal(result.confidence.level, 'Muy baja');
});

test('company scope never exposes inventory', () => {
  const result = buildForecast({ scenario, donations: steadyDonations, scope: 'empresa', inventory: [{ category: 'Vestimenta', available: 99 }], today });
  assert.equal(result.stock, null);
});

test('projection sends only aggregated numbers to the AI and uses its wording', async () => {
  let sent;
  const result = await projectCampaign({
    input: scenario, donations: steadyDonations, apiKey: 'test-secret', model: 'test-model', today,
    fetchImpl: async (_url, options) => {
      sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: '```json\n{"summary":"Ritmo estable.","recommendations":["Mantener la convocatoria"]}\n```' } }] }) };
    }
  });
  assert.equal(result.narrative.source, 'ia');
  assert.equal(result.summary, 'Ritmo estable.');
  assert.deepEqual(result.weeklyUnits, [6, 6, 6, 6]);
  assert.equal(sent.model, 'test-model');
  assert.doesNotMatch(JSON.stringify(sent), /Nombre privado|private-/);
});

test('projection falls back to the automatic narrative when the AI is unavailable or disabled', async () => {
  let calls = 0;
  const failing = async () => { calls += 1; return { ok: false, status: 500 }; };
  const withFailure = await projectCampaign({ input: scenario, donations: steadyDonations, apiKey: 'test-secret', fetchImpl: failing, today });
  assert.equal(withFailure.narrative.source, 'automática');
  assert.equal(calls, 1);
  const withoutKey = await projectCampaign({ input: scenario, donations: steadyDonations, apiKey: '', fetchImpl: failing, today });
  assert.equal(withoutKey.narrative.source, 'automática');
  const disabled = await projectCampaign({ input: { ...scenario, useAI: false }, donations: steadyDonations, apiKey: 'test-secret', fetchImpl: failing, today });
  assert.equal(disabled.narrative.source, 'automática');
  assert.equal(calls, 1);
});

test('projection rejects invalid inputs', async () => {
  await assert.rejects(projectCampaign({ input: { ...scenario, weeks: 53 } }), error => error.status === 400);
  await assert.rejects(projectCampaign({ input: { ...scenario, goal: 0 } }), error => error.status === 400);
  await assert.rejects(projectCampaign({ input: { ...scenario, category: '  ' } }), error => error.status === 400);
});

test('projection supports the advertised maximum of 52 weeks', async () => {
  const result = await projectCampaign({ input: { ...scenario, weeks: 52, useAI: false } });
  assert.equal(result.forecast.weeks.length, 52);
});
