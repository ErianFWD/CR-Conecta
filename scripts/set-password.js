import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const directory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(directory, '..');
const database = JSON.parse(await readFile(resolve(projectDirectory, 'db.json'), 'utf8'));
const authPath = resolve(projectDirectory, 'server', 'auth.json');
const userId = process.argv[2];
const user = database.users.find(account => account.id === userId);

if (!user) {
  console.error('Indicá un ID existente. Ejemplo: npm run auth:set-password -- u1');
  process.exitCode = 1;
} else {
  const password = await readSecret(`Nueva contraseña para ${user.name}: `);
  if (password.length < 12) {
    console.error('\nLa contraseña debe tener al menos 12 caracteres.');
    process.exitCode = 1;
  } else {
    const salt = randomBytes(16).toString('hex');
    const hash = await scrypt(password, salt, 64);
    let credentials = {};
    try {
      credentials = JSON.parse(await readFile(authPath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    credentials[userId] = { salt, hash: hash.toString('hex') };
    await writeFile(authPath, `${JSON.stringify(credentials, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log(`Contraseña configurada para ${user.email}.`);
  }
}

function readSecret(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Ejecutá este comando en una terminal interactiva para ingresar la contraseña de forma segura.');
  }
  return new Promise((resolveSecret, reject) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = '';
    const onData = chunk => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Operación cancelada.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          resolveSecret(value);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        if (character >= ' ' && character <= '~') value += character;
      }
    };
    const cleanup = () => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
    };
    process.stdin.on('data', onData);
  });
}
