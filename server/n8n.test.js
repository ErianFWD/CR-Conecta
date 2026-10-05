import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { notifyN8n } from './n8n.js';

const workflow = JSON.parse(await readFile(new URL('../n8n/CR-Conecta-Avisos-y-Comprobantes.json', import.meta.url), 'utf8'));
const fixture = () => ({ eventId: 'donation.registered:DON-TEST1', type: 'donation.registered', occurredAt: '2026-10-05T14:00:00Z', data: {
  id: 'DON-TEST1', product: '<script>alert(1)</script>', category: 'Alimentos sellados', quantity: 2,
  destination: 'Institución', date: '2026-10-05', status: 'Registrada', province: 'Puntarenas', canton: 'Puntarenas', anonymous: false,
  recipient: { name: 'Erian registrado', email: 'donante@example.test', identification: '123456789' }
} });

// Run the exported Code/IF expressions and connections with fake external nodes.
// Does not assert real OAuth, SMTP or n8n import behavior; those require the user's instance.
async function execute(body, { rows = [], hacienda = { nombre: 'Erian Andres Badilla Fallas' }, failEmail = '', failSheet = false } = {}) {
  const outputs = new Map([['Donación registrada', [{ json: { body } }]]]);
  const sent = [];
  let queries = 0;
  const $ = name => ({ first: () => outputs.get(name)?.[0], all: () => outputs.get(name) || [] });
  const expression = (value, json) => typeof value === 'string' && value.startsWith('={{')
    ? new Function('$json', '$', `return (${value.slice(3, -2)});`)(json, $) : value;
  let next = workflow.connections['Donación registrada'].main[0][0].node;
  while (next) {
    const node = workflow.nodes.find(item => item.name === next);
    assert.ok(node, `Unknown node ${next}`);
    const incoming = outputs.get('__current') || outputs.get('Donación registrada');
    let result, branch = 0;
    if (node.type.endsWith('.code')) {
      let source = node.parameters.jsCode;
      if (node.name === 'Configurar y validar donación') source = source
        .replace('avisos@ejemplo.invalid', 'avisos@example.test').replace('equipo@ejemplo.invalid', 'equipo@example.test')
        .replace('PEGA_AQUI_EL_ID_DE_GOOGLE_SHEETS', 'fake-sheet');
      result = new Function('$input', '$', source)({ first: () => incoming[0], all: () => incoming }, $);
    } else if (node.type.endsWith('.if')) {
      branch = expression(node.parameters.conditions.conditions[0].leftValue, incoming[0].json) ? 0 : 1;
      result = incoming;
    } else if (node.type.endsWith('.httpRequest')) {
      queries++;
      result = [{ json: hacienda }];
    } else if (node.type.endsWith('.googleSheets')) {
      if (failSheet) throw new Error('Sheets unavailable');
      if (node.parameters.operation === 'read') result = rows.filter(row => row.EventId === body.eventId).map(json => ({ json }));
      else {
        const values = Object.fromEntries(Object.entries(node.parameters.columns.value).map(([key, value]) => [key, expression(value, incoming[0].json)]));
        let row = rows.find(row => row.EventId === values.EventId);
        if (!row) { row = {}; rows.push(row); }
        Object.assign(row, values);
        result = [{ json: structuredClone(row) }];
      }
      if (!result.length) result = [{ json: {} }];
    } else if (node.type.endsWith('.emailSend')) {
      const params = node.parameters;
      assert.equal(params.emailFormat, 'html');
      const email = { to: expression(params.toEmail, incoming[0].json), html: expression(params.html, incoming[0].json) };
      sent.push(email);
      result = [{ json: email.to === failEmail ? { error: 'SMTP failure' } : { accepted: [email.to], rejected: [] } }];
    } else throw new Error(`Unsupported node ${node.type}`);
    outputs.set(node.name, result);
    outputs.set('__current', result);
    next = workflow.connections[node.name]?.main[branch]?.[0]?.node;
  }
  return { sent, rows, queries };
}

test('notification failure never invalidates a saved action', async () => {
  const oldWarn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(await notifyN8n({ url: 'https://n8n.example/hook', token: 'secret', type: 'request.approved',
      data: { id: 'CC-1' }, fetchImpl: async () => { throw new Error('network offline'); } }), false);
    assert.equal(await notifyN8n({ type: 'request.approved', data: { id: 'CC-1' },
      fetchImpl: async () => { throw new Error('Should not run'); } }), false);
  } finally { console.warn = oldWarn; }
});

test('workflow sends personalized escaped receipt to donor, separate notice to team and logs acceptance', async () => {
  const { sent, rows, queries } = await execute(fixture());
  assert.equal(queries, 1);
  assert.deepEqual(sent.map(email => email.to), ['donante@example.test', 'equipo@example.test']);
  assert.match(sent[0].html, /Hola Erian Andres Badilla Fallas:/);
  assert.match(sent[0].html, /&lt;script&gt;/);
  assert.doesNotMatch(sent[0].html, /<script>/);
  assert.equal(rows[0].EstadoCorreo, 'Enviado');
  assert.equal(rows[0].EstadoEquipo, 'Enviado');
  assert.ok(rows[0].FechaEnvio);
  assert.doesNotMatch(JSON.stringify({ rows, sent }), /123456789|identification/);
});

test('Hacienda 404, rate limit and network error use registered name', async () => {
  for (const hacienda of [{ statusCode: 404 }, { statusCode: 429 }, { error: 'timeout' }]) {
    const result = await execute(fixture(), { hacienda });
    assert.match(result.sent[0].html, /Hola Erian registrado:/);
    assert.equal(result.rows[0].FuenteNombre, 'Registro');
  }
});

test('anonymous donors receive private greeting while Sheets and team omit identity', async () => {
  const body = fixture(); body.data.anonymous = true;
  const { sent, rows } = await execute(body);
  assert.match(sent[0].html, /Hola Erian Andres Badilla Fallas:/);
  assert.equal(rows[0].Nombre, 'Anónimo');
  assert.equal(rows[0].Correo, '');
  assert.doesNotMatch(sent[1].html + JSON.stringify(rows), /Erian|donante@example|123456789/);
});

test('repeated completed event does not send either email again', async () => {
  const body = fixture(); const first = await execute(body);
  const second = await execute(body, { rows: first.rows });
  assert.equal(second.sent.length, 0);
  assert.equal(second.rows.length, 1);
});

test('failed team email is logged; replay skips successful donor and retries team only', async () => {
  const body = fixture(); const first = await execute(body, { failEmail: 'equipo@example.test' });
  assert.equal(first.rows[0].EstadoEquipo, 'Error');
  assert.equal(first.rows[0].EstadoCorreo, 'Enviado');
  const second = await execute(body, { rows: first.rows });
  assert.deepEqual(second.sent.map(email => email.to), ['equipo@example.test']);
  assert.equal(second.rows[0].EstadoEquipo, 'Enviado');
  assert.equal(second.rows[0].ErrorEquipo, '');
});

test('failed donor email is logged without preventing team notice', async () => {
  const result = await execute(fixture(), { failEmail: 'donante@example.test' });
  assert.equal(result.rows[0].EstadoCorreo, 'Error');
  assert.equal(result.rows[0].FechaEnvio, '');
  assert.equal(result.rows[0].EstadoEquipo, 'Enviado');
});

test('Sheets outage stops emails; duplicate rows and mismatched event id stop processing', async () => {
  await assert.rejects(execute(fixture(), { failSheet: true }), /Sheets unavailable/);
  await assert.rejects(execute(fixture(), { rows: [{ EventId: fixture().eventId }, { EventId: fixture().eventId }] }), /filas duplicadas/);
  const body = fixture(); body.eventId = 'donation.registered:DON-OTHER';
  await assert.rejects(execute(body), /Evento de donación inválido/);
});

test('sheet formula payload is stored as text, not executable content', async () => {
  const body = fixture(); body.data.product = '=IMPORTXML("https://example.test", "//x")';
  const result = await execute(body);
  assert.ok(result.rows[0].Producto.startsWith("'="));
  for (const node of workflow.nodes.filter(n => n.type.endsWith('.googleSheets') && n.parameters.operation !== 'read')) assert.equal(node.parameters.options.cellFormat, 'RAW');
});

test('both webhooks and all referenced nodes exist; SMTP HTML uses supported parameter', () => {
  const names = new Set(workflow.nodes.map(n => n.name));
  assert.ok(names.has('Solicitud aprobada'));
  assert.ok(names.has('Avisar al equipo'));
  for (const [source, connections] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source));
    for (const output of connections.main) for (const target of output) assert.ok(names.has(target.node));
  }
  for (const node of workflow.nodes.filter(n => n.type.endsWith('.emailSend'))) assert.equal(node.parameters.emailFormat, 'html');
});
