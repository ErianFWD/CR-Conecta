import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAssistantDestination, validateAssistantPath } from './assistantNavigation.js';

test('the browser accepts only exact public paths', () => {
  assert.deepEqual(validateAssistantPath('/donar'), { path: '/donar', label: 'Donar' });
  for (const path of ['/panel', '/perfil', '/admin', '/donar?next=/panel', 'https://ejemplo.com', '//ejemplo.com']) {
    assert.equal(validateAssistantPath(path), null, path);
  }
  assert.equal(resolveAssistantDestination('donar')?.path, '/donar');
  assert.equal(resolveAssistantDestination('perfil'), null);
});
