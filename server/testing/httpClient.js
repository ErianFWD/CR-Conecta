import { Readable } from 'node:stream';
import { createApiServer } from '../api.js';

// In-process HTTP transport: runs the real handler, cookies, authorization and persistence.
// No sockets or third-party network calls are needed by the API integration tests.
const servers = new Map();
let port = 10000;
export function createApiTestServer(options) {
  const server = createApiServer(options);
  const assignedPort = ++port;
  return {
    listen(_port, _host, callback) { servers.set(assignedPort, server); callback(); },
    address() { return { port: assignedPort }; },
    close(callback) { servers.delete(assignedPort); callback(); }
  };
}
export function testFetch(address, options = {}) {
  const url = new URL(address);
  const server = servers.get(Number(url.port));
  if (!server) return Promise.reject(new Error('Servidor de prueba no registrado.'));
  return new Promise((resolve, reject) => {
    const req = Readable.from(options.body ? [options.body] : []);
    Object.assign(req, { method: options.method || 'GET', url: url.pathname + url.search,
      headers: Object.fromEntries(new Headers(options.headers)), socket: { remoteAddress: '127.0.0.1' } });
    let status = 200, headers = {};
    const timer = setTimeout(() => reject(new Error('El handler no respondió.')), 5000);
    const response = {
      writeHead(code, values) { status = code; headers = values; },
      end(body) { clearTimeout(timer); resolve(new Response(status === 204 ? null : body, { status, headers })); }
    };
    server.emit('request', req, response);
  });
}
