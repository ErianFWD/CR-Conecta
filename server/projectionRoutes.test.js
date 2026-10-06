import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiTestServer, testFetch } from './testing/httpClient.js';

test('projection tracking persists, isolates owners, checks roles and acknowledges final results', async t => {
  const database = { users: [{ id: 'a', role: 'Administrador' }, { id: 'b', role: 'Empresa donante' }, { id: 'd', role: 'Donante individual' }], donations: [], requests: [] };
  let persisted = 0;
  const server = createApiTestServer({ database, demoPassword: 'test-password', assistantApiKey: '', persist: async () => { persisted++; } });
  server.listen(0, '127.0.0.1', () => {});
  t.after(() => server.close(() => {}));
  const url = `http://localhost:${server.address().port}`;
  const login = async id => {
    const res = await testFetch(url + '/auth/login', { method: 'POST', body: JSON.stringify({ userId: id, password: 'test-password' }) });
    return res.headers.get('set-cookie').split(';')[0];
  };
  const admin = await login('a'), company = await login('b'), donor = await login('d');
  const options = cookie => ({ headers: { cookie } });
  assert.equal((await testFetch(url + '/projections')).status, 401);
  assert.equal((await testFetch(url + '/projections', options(donor))).status, 403);
  const response = await testFetch(url + '/assistant/campaign-projection', { method: 'POST', ...options(admin), body: JSON.stringify({ category: 'Vestimenta', goal: 3, weeks: 1, useAI: false, track: true }) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(result.trackingId);
  assert.ok(persisted > 0);
  assert.equal(database.projections.length, 1);
  assert.deepEqual(await (await testFetch(url + '/projections', options(company))).json(), []);
  const item = database.projections[0];
  item.startedAt = '2026-01-01T00:00:00Z'; item.endsAt = '2026-01-08T00:00:00Z';
  let rows = await (await testFetch(url + '/projections', options(admin))).json();
  assert.equal(rows[0].status, 'fallida');
  assert.equal(rows[0].baselineDonationIds, undefined);
  const path = `/projections/${item.id}/acknowledge`;
  assert.equal((await testFetch(url + path, { method: 'POST', ...options(company) })).status, 404);
  assert.equal((await testFetch(url + path, { method: 'POST', ...options(admin) })).status, 200);
  rows = await (await testFetch(url + '/projections', options(admin))).json();
  assert.equal(rows[0].acknowledgedStatus, 'fallida');
  const restored = JSON.parse(JSON.stringify(database));
  assert.equal(restored.projections[0].snapshot.scenario.goal, 3);
});
