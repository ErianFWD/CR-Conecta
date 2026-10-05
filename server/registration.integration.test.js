import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createApiServer } from './api.js';

// Exercise the real HTTP handler without binding a port or contacting external services.
async function request(server, method, url, body, cookie) {
  const req = Readable.from(body ? [JSON.stringify(body)] : []);
  Object.assign(req, { method, url, headers: { cookie, 'content-type': 'application/json' }, socket: { remoteAddress: 'integration-test' } });
  return new Promise(resolve => {
    let code, headers;
    server.emit('request', req, {
      writeHead(status, values) { code = status; headers = values; },
      end(value) { resolve({ code, headers, payload: value ? JSON.parse(value) : null }); }
    });
  });
}
const civic = { identification: '123456789', location: { provinceId: '1', province: 'San José', cantonId: '101', canton: 'San José', districtId: '', district: '' } };
test('registration persists identity/location, starts session and allows a new request', async () => {
  const database = { users: [], requests: [], activity: [] };
  let persisted;
  const server = createApiServer({ database, persist: async db => { persisted = structuredClone(db); }, persistCredentials: async () => {} });
  const invalid = await request(server, 'POST', '/auth/register', { name: 'Prueba', email: 'prueba@example.test', role: 'Beneficiario', password: 'PasswordDemo1' });
  assert.equal(invalid.code, 400);
  assert.equal(database.users.length, 0);
  const created = await request(server, 'POST', '/auth/register', { ...civic, name: 'Prueba', email: 'prueba@example.test', role: 'Beneficiario', password: 'PasswordDemo1' });
  assert.equal(created.code, 201);
  assert.deepEqual(created.payload.location, civic.location);
  assert.equal(persisted.users[0].identification, civic.identification);
  assert.equal(created.payload.password, undefined);
  const cookie = created.headers['Set-Cookie'].split(';')[0];
  const result = await request(server, 'POST', '/requests', { ...civic, category: 'Alimentos sellados', description: 'Paquete de arroz', amount: 1, date: new Date().toISOString().slice(0, 10) }, cookie);
  assert.equal(result.code, 201);
  assert.equal(result.payload.zone, 'San José');
  assert.equal(persisted.requests[0].identification, civic.identification);
  const publicRows = await request(server, 'GET', '/requests');
  assert.doesNotMatch(JSON.stringify(publicRows.payload), /identification/);
});
