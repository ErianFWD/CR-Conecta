import { rename, writeFile } from 'node:fs/promises';

export function createJsonPersistence(databasePath) {
  let writeQueue = Promise.resolve();
  return data => {
    const write = writeQueue.then(async () => {
      const temporaryPath = `${databasePath}.${process.pid}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, databasePath);
    });
    writeQueue = write.catch(() => {});
    return write;
  };
}
