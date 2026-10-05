import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createApiServer } from './api.js';
import { createJsonPersistence } from './persistence.js';

const directory = dirname(fileURLToPath(import.meta.url));
const databasePath = resolve(directory, '..', 'db.json');
const authPath = resolve(directory, 'auth.json');
const database = JSON.parse(await readFile(databasePath, 'utf8'));

let authUsers = {};
try {
  authUsers = JSON.parse(await readFile(authPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configurá server/auth.json con npm run auth:set-password antes de iniciar en producción.', { cause: error });
  }
}

if (process.env.NODE_ENV === 'production') {
  const missingUsers = database.users.filter(user => !authUsers[user.id]?.salt || !authUsers[user.id]?.hash);
  if (missingUsers.length) {
    throw new Error(`Configurá las contraseñas de todas las cuentas con npm run auth:set-password -- <id>. Faltan: ${missingUsers.map(user => user.id).join(', ')}`);
  }
}

const server = createApiServer({
  database,
  persist: createJsonPersistence(databasePath),
  persistCredentials: createJsonPersistence(authPath),
  authUsers
});
const port = Number(process.env.PORT || 3001);
server.listen(port, () => {
  console.log(`CR Conecta API disponible en http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
