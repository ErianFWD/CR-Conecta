import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupIdentity, lookupGeography, registrationDetails } from './costaRica.js';
const location = { provinceId: '1', province: 'San José', cantonId: '101', canton: 'San José', districtId: '', district: '' };
test('Hacienda: normalized name, bounded output, cache and invalid identity', async () => {
  let calls = 0;
  const remote = async url => {
    calls += 1;
    assert.match(url, /^https:\/\/api.hacienda.go.cr\/fe\/ae\?identificacion=/);
    return { ok: true, json: async () => ({ nombre: ' Persona de prueba ', actividades: ['no exportar'] }) };
  };
  assert.deepEqual(await lookupIdentity('123456789', remote), { identification: '123456789', name: 'Persona de prueba', source: 'Ministerio de Hacienda' });
  await lookupIdentity('123456789', remote);
  assert.equal(calls, 1);
  await assert.rejects(() => lookupIdentity('abc', remote), /cédula/);
  await assert.rejects(() => lookupIdentity('223456789', async () => ({ status: 429 })), error => error.status === 429);
});
test('Geo CR follows parent route and includes all pages', async () => {
  const urls = [];
  const rows = await lookupGeography('cantons', '1', async url => {
    urls.push(url);
    return { ok: true, json: async () => ({ data: [{ idCanton: urls.length === 1 ? 101 : 102, descripcion: urls.length === 1 ? 'San José' : 'Escazú' }], meta: { totalPages: 2 } }) };
  });
  assert.equal(rows.length, 2);
  assert.match(urls[0], /provincias\/1\/cantones\?page=1/);
  assert.match(urls[1], /page=2/);
  await assert.rejects(() => lookupGeography('cantons', '../users'), /ubicación/);
});
test('registration requires identification and a complete location, preserving codes', () => {
  assert.throws(() => registrationDetails({}, true), /cédula/);
  assert.throws(() => registrationDetails({ identification: '123456789' }, true), /provincia/);
  const details = registrationDetails({ identification: '1-2345-6789', location }, true);
  assert.equal(details.zone, 'San José');
  assert.equal(details.identification, '123456789');
  assert.deepEqual(details.location, location);
});
