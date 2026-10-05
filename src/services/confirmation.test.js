import test from 'node:test';
import assert from 'node:assert/strict';
import { mutationPrompt, requestConfirmation, setConfirmationHandler } from './confirmation.js';
test('confirmation protects writes and allows ordinary reads and AI queries', async () => {
  assert.equal(mutationPrompt('/requests', 'GET'), null);
  assert.equal(mutationPrompt('/assistant/chat', 'POST'), null);
  assert.equal(mutationPrompt('/sections/s1', 'DELETE').danger, true);
  assert.match(mutationPrompt('/requests/r1', 'PATCH', '{"status":"Aprobada"}').text, /aprobada/);
  assert.equal(mutationPrompt('/auth/logout', 'POST').title, 'Cerrar sesión');
  assert.equal(await requestConfirmation({ title: 'prueba' }), false);
  setConfirmationHandler(async () => false);
  assert.equal(await requestConfirmation({}), false);
  setConfirmationHandler(async () => true);
  assert.equal(await requestConfirmation({}), true);
  setConfirmationHandler(null);
});
