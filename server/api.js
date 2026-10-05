import { lookupIdentity, lookupGeography, registrationDetails } from './costaRica.js';
import { createServer } from 'node:http';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { evaluateRequest, createRequest, nextSectionId, nextUserId, publicRequest, validateNewSection, validateNewUser, ValidationError } from './validation.js';
import { CATEGORY_LIMITS } from '../src/constants/limits.js';
import { answerSiteQuestion } from './assistant.js';
import { projectCampaign } from './projection.js';
import { notifyN8n } from './n8n.js';
import { isValidDonationPhoto } from './donationPhoto.js';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'cr_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const ADMIN = 'Administrador';
const DONOR_ROLES = new Set(['Donante individual', 'Empresa donante']);

function send(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  response.end(payload === null ? '' : JSON.stringify(payload));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024 * 1024) {
      const error = new Error('El cuerpo de la solicitud supera el tamaño permitido.');
      error.status = 413;
      throw error;
    }
  }
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('El cuerpo debe ser JSON válido.');
    error.status = 400;
    throw error;
  }
}

function cookieValue(header, name) {
  return header?.split(';').map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    zone: user.zone,
    phone: user.phone,
    identification: user.identification,
    location: user.location,
    notes: user.notes
  };
}

function safeDemoUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, zone: user.zone };
}

function recordActivity(database, actor, action, entity, entityId, detail = '') {
  database.activity ||= [];
  database.activity.unshift({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor: actor.name,
    actorRole: actor.role,
    action,
    entity,
    entityId: String(entityId),
    detail
  });
  if (database.activity.length > 500) database.activity.length = 500;
}

async function verifyPassword(password, credential) {
  if (!credential?.salt || !credential?.hash) return false;
  const derived = await scrypt(password, credential.salt, 64);
  const expected = Buffer.from(credential.hash, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return { salt, hash: derived.toString('hex') };
}

function canManageUsers(user, targetUserId) {
  return user && (user.role === ADMIN || user.id === targetUserId);
}

function allowedCollectionRows(collection, user, database) {
  const rows = database[collection] || [];
  switch (collection) {
    case 'requests':
      if (!user) return rows.filter(row => row.status === 'Aprobada').map(publicRequest);
      if (user.role === ADMIN) return rows;
      if (user.role === 'Beneficiario') return rows.filter(row => row.beneficiaryId === user.id);
      if (user.role === 'Aliado comunitario') {
        return rows.filter(row => row.status === 'Aprobada' && row.zone === user.zone).map(publicRequest);
      }
      return rows.filter(row => row.status === 'Aprobada').map(publicRequest);
    case 'donations':
      if (user?.role === ADMIN) return rows;
      if (DONOR_ROLES.has(user?.role)) return rows.filter(row => row.donorId === user.id);
      return [];
    case 'transfers':
      if (user?.role === ADMIN) return rows;
      if (user?.role === 'Voluntario') return rows.filter(row => row.responsible === user.name);
      return [];
    case 'inventory':
      return user?.role === ADMIN ? rows : [];
    case 'campaigns':
      if (user?.role === ADMIN) return rows;
      return user?.role === 'Empresa donante'
        ? rows.filter(row => row.companyId === user.id)
        : [];
    case 'jobs':
      return user && ['Administrador', 'Beneficiario', 'Empresa donante'].includes(user.role) ? rows : [];
    case 'allies':
      return rows.map(({ id, name, type, description, zone, logo, website, category, badge, support }) => ({
        id, name, type, description, zone, logo, website, category, badge, support
      }));
    case 'sections':
      return rows;
    case 'facilities':
    case 'chatbot':
      return rows;
    default:
      return null;
  }
}

function requestCookie(token, secure) {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? '; Secure' : ''}`;
}

export function createApiServer({
  database,
  persist = async () => {},
  persistCredentials = async () => {},
  demoPassword = process.env.CR_DEMO_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : 'conecta-demo'),
  authUsers = {},
  assistantApiKey = process.env.GROQ_API_KEY,
  assistantModel = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  assistantFetch = fetch,
  n8nApprovalUrl = process.env.N8N_APPROVAL_WEBHOOK_URL,
  n8nDonationUrl = process.env.N8N_DONATION_WEBHOOK_URL,
  n8nToken = process.env.N8N_WEBHOOK_TOKEN,
  n8nFetch = fetch,
  allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  secureCookies = process.env.NODE_ENV === 'production'
}) {
  const sessions = new Map();
  const loginAttempts = new Map();
  const registerAttempts = new Map();
  const lookupAttempts = new Map();
  const assistantAttempts = new Map();
  const projectionAttempts = new Map();

  async function getCurrentUser(request) {
    const token = cookieValue(request.headers.cookie, SESSION_COOKIE);
    const session = token && sessions.get(token);
    if (!session || session.expiresAt <= Date.now()) {
      if (token) sessions.delete(token);
      return null;
    }
    const user = database.users.find(item => item.id === session.userId);
    return user ? safeUser(user) : null;
  }

  async function handle(request, response) {
    const origin = request.headers.origin;
    if (origin && origin !== allowedOrigin) {
      send(response, 403, { message: 'Origen no permitido.' });
      return;
    }

    const corsHeaders = origin ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin'
    } : {};

    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    try {
      const url = new URL(request.url, 'http://localhost');
      const path = url.pathname.split('/').filter(Boolean);
      const user = await getCurrentUser(request);

      if (path[0] === 'lookups' && request.method === 'GET') {
        const key = request.socket.remoteAddress || 'local';
        const now = Date.now();
        if (lookupAttempts.size > 1000) for (const [ip, value] of lookupAttempts) { if (value.until < now) lookupAttempts.delete(ip); }
        const attempt = lookupAttempts.get(key) || { count: 0, until: now + 60000 };
        if (attempt.until < now) { attempt.count = 0; attempt.until = now + 60000; }
        attempt.count += 1;
        lookupAttempts.set(key, attempt);
        if (attempt.count > 60) { send(response, 429, { message: 'Esperá un minuto antes de consultar nuevamente.' }, corsHeaders); return; }
        const result = path[1] === 'identity'
          ? await lookupIdentity(url.searchParams.get('identification'))
          : path[1] === 'geo' ? await lookupGeography(path[2], url.searchParams.get('parent')) : null;
        send(response, result ? 200 : 404, result || { message: 'Consulta no disponible.' }, corsHeaders);
        return;
      }

      if (path[0] === 'auth' && path[1] === 'demo-users' && request.method === 'GET') {
        send(response, 200, database.users.map(safeDemoUser), corsHeaders);
        return;
      }

      if (path[0] === 'auth' && path[1] === 'register' && request.method === 'POST') {
        const attemptKey = request.socket.remoteAddress || 'unknown';
        const attempt = registerAttempts.get(attemptKey);
        if (attempt?.lockedUntil > Date.now()) {
          send(response, 429, { message: 'Demasiados registros. Probá de nuevo en 15 minutos.' }, corsHeaders);
          return;
        }
        const body = await readBody(request);
        const fields = validateNewUser(body, database.users);
        if (fields.role === ADMIN) {
          send(response, 400, { message: 'El rol Administrador no está disponible para autorregistro.' }, corsHeaders);
          return;
        }
        const id = nextUserId(database.users);
        const { password, ...profile } = fields;
        const account = { id, ...profile };

        database.users.push(account);
        authUsers[id] = await hashPassword(password);
        try {
          await persistCredentials(authUsers);
          await persist(database);
        } catch (error) {
          database.users.pop();
          delete authUsers[id];
          throw error;
        }
        const nextFailures = attempt?.windowStartedAt > Date.now() - 15 * 60 * 1000 ? attempt.failures + 1 : 1;
        registerAttempts.set(attemptKey, {
          failures: nextFailures,
          windowStartedAt: attempt?.windowStartedAt > Date.now() - 15 * 60 * 1000 ? attempt.windowStartedAt : Date.now(),
          lockedUntil: nextFailures >= 10 ? Date.now() + 15 * 60 * 1000 : 0
        });
        recordActivity(database, safeUser(account), 'se registró', 'cuenta', id, account.role);

        const token = randomBytes(32).toString('base64url');
        sessions.set(token, { userId: id, expiresAt: Date.now() + SESSION_TTL_MS });
        send(response, 201, safeUser(account), {
          ...corsHeaders,
          'Set-Cookie': requestCookie(token, secureCookies)
        });
        return;
      }

      if (path[0] === 'auth' && path[1] === 'login' && request.method === 'POST') {
        const body = await readBody(request);
        const attemptKey = request.socket.remoteAddress || 'unknown';
        const attempt = loginAttempts.get(attemptKey);
        if (attempt?.lockedUntil > Date.now()) {
          send(response, 429, { message: 'Demasiados intentos. Probá de nuevo en 15 minutos.' }, corsHeaders);
          return;
        }
        const account = database.users.find(item => item.id === body.userId);
        let valid = false;
        if (account && typeof body.password === 'string') {
          const credential = authUsers[account.id];
          valid = credential
            ? await verifyPassword(body.password, credential)
            : Boolean(demoPassword) && body.password === demoPassword && process.env.NODE_ENV !== 'production';
        }
        if (!valid) {
          const nextFailures = attempt?.windowStartedAt > Date.now() - 15 * 60 * 1000
            ? attempt.failures + 1
            : 1;
          loginAttempts.set(attemptKey, {
            failures: nextFailures,
            windowStartedAt: attempt?.windowStartedAt > Date.now() - 15 * 60 * 1000 ? attempt.windowStartedAt : Date.now(),
            lockedUntil: nextFailures >= 10 ? Date.now() + 15 * 60 * 1000 : 0
          });
          send(response, 401, { message: 'Cuenta o contraseña incorrecta.' }, corsHeaders);
          return;
        }
        loginAttempts.delete(attemptKey);
        const token = randomBytes(32).toString('base64url');
        recordActivity(database, safeUser(account), 'inició sesión', 'sesión', account.id);
        await persist(database);
        sessions.set(token, { userId: account.id, expiresAt: Date.now() + SESSION_TTL_MS });
        send(response, 200, safeUser(account), {
          ...corsHeaders,
          'Set-Cookie': requestCookie(token, secureCookies)
        });
        return;
      }

      if (path[0] === 'auth' && path[1] === 'session' && request.method === 'GET') {
        if (!user) {
          send(response, 401, { message: 'No hay una sesión activa.' }, corsHeaders);
          return;
        }
        send(response, 200, user, corsHeaders);
        return;
      }

      if (path[0] === 'auth' && path[1] === 'logout' && request.method === 'POST') {
        const token = cookieValue(request.headers.cookie, SESSION_COOKIE);
        if (token) sessions.delete(token);
        send(response, 200, { ok: true }, {
          ...corsHeaders,
          'Set-Cookie': `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies ? '; Secure' : ''}`
        });
        return;
      }

      if (path[0] === 'assistant' && path[1] === 'chat' && request.method === 'POST') {
        const clientKey = request.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const recentAttempts = (assistantAttempts.get(clientKey) || []).filter(time => time > now - 10 * 60 * 1000);
        if (recentAttempts.length >= 20) {
          send(response, 429, { message: 'Llegaste al límite de consultas. Intentá de nuevo en unos minutos.' }, corsHeaders);
          return;
        }
        recentAttempts.push(now);
        assistantAttempts.set(clientKey, recentAttempts);

        const body = await readBody(request);
        const result = await answerSiteQuestion({
          question: body.question,
          history: body.history,
          apiKey: assistantApiKey,
          model: assistantModel,
          fetchImpl: assistantFetch
        });
        send(response, 200, result, corsHeaders);
        return;
      }

      if (path[0] === 'assistant' && path[1] === 'campaign-projection' && request.method === 'POST') {
        if (!user || ![ADMIN, 'Empresa donante'].includes(user.role)) {
          send(response, user ? 403 : 401, { message: 'Solo administración y empresas donantes pueden generar proyecciones.' }, corsHeaders);
          return;
        }
        const now = Date.now();
        const attempts = (projectionAttempts.get(user.id) || []).filter(time => time > now - 10 * 60 * 1000);
        if (attempts.length >= 10) {
          send(response, 429, { message: 'Llegaste al límite temporal de proyecciones. Intentá en unos minutos.' }, corsHeaders);
          return;
        }
        const input = await readBody(request);
        const ownCampaigns = user.role === ADMIN ? database.campaigns || [] : (database.campaigns || []).filter(item => item.companyId === user.id);
        const ownDonations = user.role === ADMIN ? database.donations || [] : (database.donations || []).filter(item => item.donorId === user.id);
        const result = await projectCampaign({ input, campaigns: ownCampaigns, donations: ownDonations,
          apiKey: assistantApiKey, model: assistantModel, fetchImpl: assistantFetch });
        projectionAttempts.set(user.id, [...attempts, now]);
        send(response, 200, result, corsHeaders);
        return;
      }

      const collection = path[0];
      const itemId = path.length > 1 ? decodeURIComponent(path[1]) : null;
      if (collection === 'activity') {
        if (request.method !== 'GET') {
          send(response, 405, { message: 'Método no permitido.' }, corsHeaders);
          return;
        }
        if (user?.role !== ADMIN) {
          send(response, user ? 403 : 401, { message: 'Solo el administrador puede consultar la actividad del sistema.' }, corsHeaders);
          return;
        }
        send(response, 200, (database.activity || []).slice(0, 100), corsHeaders);
        return;
      }

      const knownCollections = new Set([
        'users', 'requests', 'donations', 'inventory', 'transfers', 'allies',
        'facilities', 'campaigns', 'jobs', 'chatbot', 'sections'
      ]);
      if (!knownCollections.has(collection)) {
        send(response, 404, { message: 'Recurso no encontrado.' }, corsHeaders);
        return;
      }

      if (collection === 'users') {
        if (request.method === 'GET') {
          if (!user || (itemId && !canManageUsers(user, itemId))) {
            send(response, user ? 403 : 401, { message: 'No tenés permiso para consultar este perfil.' }, corsHeaders);
            return;
          }
          const selected = itemId ? database.users.find(item => item.id === itemId) : database.users;
          if (!selected) {
            send(response, 404, { message: 'Perfil no encontrado.' }, corsHeaders);
            return;
          }
          send(response, 200, Array.isArray(selected) ? selected.map(safeUser) : safeUser(selected), corsHeaders);
          return;
        }
        if (request.method === 'POST' && !itemId) {
          if (!user) {
            send(response, 401, { message: 'Iniciá sesión para registrar una cuenta.' }, corsHeaders);
            return;
          }
          const input = await readBody(request);
          const fields = validateNewUser(input, database.users);
          if (fields.role === ADMIN && user.role !== ADMIN) {
            send(response, 403, { message: 'Solo el administrador puede crear cuentas con rol Administrador.' }, corsHeaders);
            return;
          }
          const id = nextUserId(database.users);
          const { password, ...profile } = fields;
          const item = { id, ...profile };

          database.users.push(item);
          authUsers[id] = await hashPassword(password);
          try {
            await persistCredentials(authUsers);
          } catch (error) {
            database.users.pop();
            delete authUsers[id];
            throw error;
          }
          recordActivity(database, user, 'registró', 'cuenta', id, item.role);
          await persist(database);
          send(response, 201, safeUser(item), corsHeaders);
          return;
        }

        if (request.method === 'PATCH' && itemId) {
          if (!user || !canManageUsers(user, itemId)) {
            send(response, 403, { message: 'No tenés permiso para actualizar este perfil.' }, corsHeaders);
            return;
          }
          const target = database.users.find(item => item.id === itemId);
          if (!target) {
            send(response, 404, { message: 'Perfil no encontrado.' }, corsHeaders);
            return;
          }
          const input = await readBody(request);
          const allowedFields = ['name', 'phone', 'zone', 'notes', 'identification', 'location'];
          const details = registrationDetails(input, true);
          if (Object.keys(input).some(key => !allowedFields.includes(key))) {
            send(response, 400, { message: 'El perfil contiene campos que no se pueden editar.' }, corsHeaders);
            return;
          }
          for (const field of ['name', 'phone', 'zone', 'notes']) {
            if (input[field] !== undefined) {
              if (typeof input[field] !== 'string' || input[field].trim().length > 500) {
                send(response, 400, { message: `El campo ${field} no es válido.` }, corsHeaders);
                return;
              }
              target[field] = input[field].trim();
            }
          }
          Object.assign(target, details);
          recordActivity(database, user, 'actualizó', 'perfil', target.id);
          await persist(database);
          send(response, 200, safeUser(target), corsHeaders);
          return;
        }
        send(response, 405, { message: 'Método no permitido.' }, corsHeaders);
        return;
      }

      if (request.method === 'GET') {
        const rows = allowedCollectionRows(collection, user, database);
        if (!rows) {
          send(response, 404, { message: 'Recurso no encontrado.' }, corsHeaders);
          return;
        }
        let result = rows;
        for (const [key, value] of url.searchParams) {
          result = result.filter(row => String(row[key] ?? '') === value);
        }
        if (itemId) {
          const item = result.find(row => String(row.id) === itemId);
          send(response, item ? 200 : 404, item || { message: 'Registro no encontrado.' }, corsHeaders);
        } else {
          send(response, 200, result, corsHeaders);
        }
        return;
      }

      if (collection === 'sections') {
        if (request.method === 'POST') {
          if (!user) {
            send(response, 401, { message: 'Iniciá sesión para agregar una sección.' }, corsHeaders);
            return;
          }
          const input = await readBody(request);
          const fields = validateNewSection(input);
          const item = {
            id: nextSectionId(database.sections || []),
            ...fields,
            author: user.name,
            authorId: user.id,
            role: user.role
          };
          database.sections = database.sections || [];
          database.sections.push(item);
          recordActivity(database, user, 'agregó', 'sección', item.id, item.title);
          await persist(database);
          send(response, 201, item, corsHeaders);
          return;
        }

        if (request.method === 'DELETE' && itemId) {
          const index = (database.sections || []).findIndex(item => item.id === itemId);
          if (index === -1) {
            send(response, 404, { message: 'Sección no encontrada.' }, corsHeaders);
            return;
          }
          if (!user || (user.role !== ADMIN && database.sections[index].authorId !== user.id)) {
            send(response, user ? 403 : 401, { message: 'Solo podés quitar las secciones que agregaste.' }, corsHeaders);
            return;
          }
          const [removed] = database.sections.splice(index, 1);
          recordActivity(database, user, 'quitó', 'sección', removed.id, removed.title);
          await persist(database);
          send(response, 200, { message: 'Sección eliminada.', id: removed.id }, corsHeaders);
          return;
        }
      }

      if (collection === 'requests' && request.method === 'POST') {
        if (user?.role !== 'Beneficiario') {
          send(response, user ? 403 : 401, { message: 'Solo una persona beneficiaria autenticada puede crear solicitudes.' }, corsHeaders);
          return;
        }
        const input = await readBody(request);
        const id = `CC-${randomUUID().slice(0, 8).toUpperCase()}`;
        const details = registrationDetails(input, true);
        const item = { ...createRequest({ ...input, zone: details.zone }, user, database.requests || [], id, new Date().toISOString().slice(0, 10)), ...details };
        database.requests ||= [];
        database.requests.push(item);
        recordActivity(database, user, 'registró', 'solicitud', item.id, item.status);
        await persist(database);
        send(response, 201, item, corsHeaders);
        return;
      }

      if (collection === 'requests' && request.method === 'PATCH' && itemId) {
        if (!user) {
          send(response, 401, { message: 'Iniciá sesión para modificar una solicitud.' }, corsHeaders);
          return;
        }
        const item = (database.requests || []).find(row => String(row.id) === itemId);
        if (!item) {
          send(response, 404, { message: 'Solicitud no encontrada.' }, corsHeaders);
          return;
        }
        const input = await readBody(request);
        const previousStatus = item.status;
        if (user.role === 'Beneficiario' && item.beneficiaryId === user.id) {
          const allowedKeys = ['deliveryConfirmed', 'deliveryConfirmationDate'];
          if (item.status !== 'Aprobada' || Object.keys(input).some(key => !allowedKeys.includes(key)) || input.deliveryConfirmed !== true) {
            send(response, 403, { message: 'Solo podés confirmar la entrega de una solicitud aprobada propia.' }, corsHeaders);
            return;
          }
          item.deliveryConfirmed = true;
          item.deliveryConfirmationDate = typeof input.deliveryConfirmationDate === 'string'
            ? input.deliveryConfirmationDate
            : new Date().toISOString().slice(0, 10);
        } else if (user.role === ADMIN) {
          Object.assign(item, evaluateRequest(item, input, database.requests || [], user));
        } else {
          send(response, 403, { message: 'No tenés permiso para evaluar esta solicitud.' }, corsHeaders);
          return;
        }
        recordActivity(
          database,
          user,
          user.role === 'Beneficiario' ? 'confirmó la entrega de' : 'actualizó',
          'solicitud',
          item.id,
          previousStatus !== item.status ? `${previousStatus} → ${item.status}` : 'Entrega confirmada'
        );
        await persist(database);
        if (user.role === ADMIN && previousStatus !== 'Aprobada' && item.status === 'Aprobada') {
          await notifyN8n({ url: n8nApprovalUrl, token: n8nToken, type: 'request.approved', fetchImpl: n8nFetch,
            data: { id: item.id, category: item.category, zone: item.zone, amount: item.amount, unit: item.unit, priority: item.priority, status: item.status } });
        }
        send(response, 200, item, corsHeaders);
        return;
      }

      if (collection === 'donations' && request.method === 'POST') {
        if (!DONOR_ROLES.has(user?.role)) {
          send(response, user ? 403 : 401, { message: 'Iniciá sesión como donante para registrar un aporte.' }, corsHeaders);
          return;
        }
        const input = await readBody(request);
        const details = registrationDetails(input, true);
        const quantity = Number(input.quantity);
        const requestId = typeof input.requestId === 'string' ? input.requestId : null;
        const linkedRequest = requestId && (database.requests || []).find(row => row.id === requestId);
        if (!isValidDonationPhoto(input.photo)) {
          send(response, 400, { message: 'Adjuntá una foto válida del producto antes de registrar la donación.' }, corsHeaders);
          return;
        }
        if (typeof input.product !== 'string' || !input.product.trim() || input.product.trim().length > 200
          || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100000
          || !CATEGORY_LIMITS[input.category]
          || (input.anonymous !== undefined && typeof input.anonymous !== 'boolean')
          || (requestId && (!linkedRequest || linkedRequest.status !== 'Aprobada'))
          || (!requestId && input.destination !== 'Institución')) {
          send(response, 400, { message: 'Describí el producto, elegí una categoría y seleccioná una solicitud aprobada válida.' }, corsHeaders);
          return;
        }
        const item = {
          id: `DON-${randomUUID().slice(0, 8).toUpperCase()}`,
          ...details,
          donorId: user.id,
          donorType: user.role,
          category: typeof input.category === 'string' ? input.category : 'Otro',
          product: input.product.trim(),
          photo: input.photo,
          quantity,
          date: new Date().toISOString().slice(0, 10),
          destination: requestId ? `Solicitud ${requestId}` : 'Institución',
          status: 'Registrada',
          anonymous: Boolean(input.anonymous),
          requestId
        };
        database.donations ||= [];
        database.donations.push(item);
        recordActivity(database, user, 'registró', 'donación', item.id, item.status);
        await persist(database);
        await notifyN8n({ url: n8nDonationUrl, token: n8nToken, type: 'donation.registered', fetchImpl: n8nFetch,
          data: { id: item.id, category: item.category, product: item.product, quantity: item.quantity, date: item.date,
            destination: item.destination, status: item.status, anonymous: item.anonymous,
            province: item.location?.province || '', canton: item.location?.canton || '',
            // Destinatario privado tomado de la sesión; nunca aceptar un correo del formulario.
            recipient: { name: user.name, email: user.email,
              identification: user.identification || item.identification || '' } } });
        send(response, 201, item, corsHeaders);
        return;
      }

      if (collection === 'transfers' && request.method === 'PATCH' && itemId) {
        const item = (database.transfers || []).find(row => String(row.id) === itemId);
        if (!item) {
          send(response, 404, { message: 'Traslado no encontrado.' }, corsHeaders);
          return;
        }
        if (!user || (user.role !== ADMIN && !(user.role === 'Voluntario' && item.responsible === user.name))) {
          send(response, user ? 403 : 401, { message: 'No tenés permiso para actualizar este traslado.' }, corsHeaders);
          return;
        }
        const input = await readBody(request);
        if (input.status !== 'Entregado' || Object.keys(input).some(key => key !== 'status')) {
          send(response, 400, { message: 'El cambio de estado solicitado no es válido.' }, corsHeaders);
          return;
        }
        item.status = 'Entregado';
        recordActivity(database, user, 'marcó como entregado', 'traslado', item.id, item.status);
        await persist(database);
        send(response, 200, item, corsHeaders);
        return;
      }

      send(response, 405, { message: 'Método no permitido.' }, corsHeaders);
    } catch (error) {
      if (error instanceof ValidationError) {
        send(response, 400, { message: error.message }, corsHeaders);
        return;
      }
      const status = error.status || 500;
      if (status >= 500) console.error('API request failed:', error);
      send(response, status, { message: status === 500 ? 'Ocurrió un error interno en la API.' : error.message }, corsHeaders);
    }
  }

  return createServer((request, response) => {
    void handle(request, response);
  });
}
