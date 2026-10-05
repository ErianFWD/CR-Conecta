import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createJsonPersistence } from './persistence.js';

test('JSON persistence atomically replaces an existing database file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cr-conecta-persistence-'));
  const databasePath = join(directory, 'db.json');
  try {
    await writeFile(databasePath, '{"before":true}\n', 'utf8');
    const persist = createJsonPersistence(databasePath);
    await Promise.all([
      persist({ first: 1 }),
      persist({ second: 2 })
    ]);
    assert.deepEqual(JSON.parse(await readFile(databasePath, 'utf8')), { second: 2 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
