import { registrationDetails } from './costaRica.js';
import { CATEGORY_LIMITS, checkRequestLimits } from '../src/constants/limits.js';

const VALID_PRIORITIES = new Set(['Alta', 'Media', 'Baja']);
const VALID_DECISIONS = new Set(['Aprobada', 'Denegada']);

export const USER_ROLES = [
  'Administrador',
  'Beneficiario',
  'Donante individual',
  'Empresa donante',
  'Voluntario',
  'Aliado comunitario'
];

export const USER_ZONES = ['Puntarenas', 'Barranca', 'El Roble', 'Chacarita', 'San José'];

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export const PUBLIC_ROLES = USER_ROLES.filter(role => role !== 'Administrador');

export function nextSectionId(sections) {
  const highest = sections.reduce((max, section) => {
    const match = /^s(\d+)$/.exec(String(section.id));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `s${highest + 1}`;
}

export function validateNewSection(input) {
  const title = readText(input?.title, 90);
  const body = readText(input?.body, 1200);

  if (title.length < 3 || title.length > 90) {
    throw new ValidationError('El título debe tener al menos 3 caracteres.');
  }
  if (body.length < 10 || body.length > 1200) {
    throw new ValidationError('El contenido debe tener al menos 10 caracteres.');
  }
  return { title, body };
}

export function nextUserId(users) {
  const highest = users.reduce((max, user) => {
    const match = /^u(\d+)$/.exec(String(user.id));
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `u${highest + 1}`;
}

export function validateNewUser(input, existingUsers) {
  const details = registrationDetails(input, true);
  const name = readText(input?.name, 120);
  const email = readText(input?.email, 160).toLowerCase();
  const role = readText(input?.role, 60);
  const zone = details.zone;
  const phone = readText(input?.phone, 40);
  const notes = readText(input?.notes, 500);
  const password = typeof input?.password === 'string' ? input.password : '';

  if (!name || name.length > 120) {
    throw new ValidationError('El nombre debe tener entre 1 y 120 caracteres.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 160) {
    throw new ValidationError('Ingresá un correo electrónico válido.');
  }
  if (!USER_ROLES.includes(role)) throw new ValidationError('Seleccioná un rol válido.');
  if (!zone || zone.length > 100) throw new ValidationError('Ingresá una zona válida.');
  if (phone.length > 40) throw new ValidationError('El teléfono es demasiado largo.');
  if (notes.length > 500) throw new ValidationError('Las notas son demasiado largas.');
  if (password.length < 8 || password.length > 200) {
    throw new ValidationError('La contraseña debe tener entre 8 y 200 caracteres.');
  }

  const duplicated = existingUsers.some(
    user => String(user.email || '').toLowerCase() === email
      || String(user.name || '').trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicated) {
    throw new ValidationError('Ya existe una cuenta con ese correo o ese nombre.');
  }

  return { name, email, role, zone, phone, notes, password, ...details };
}

export function publicRequest(request) {
  const {
    id,
    category,
    description,
    amount,
    unit,
    zone,
    date,
    status,
    priority,
    goal,
    received
  } = request;
  return { id, category, description, amount, unit, zone, date, status, priority, goal, received };
}

export function createRequest(input, user, previousRequests, id, today) {
  const category = input?.category;
  const description = typeof input?.description === 'string' ? input.description.trim() : '';
  const amount = Number(input?.amount);
  const zone = typeof input?.zone === 'string' ? input.zone.trim() : '';
  const date = typeof input?.date === 'string' ? input.date : '';

  if (!CATEGORY_LIMITS[category]) throw new ValidationError('Seleccioná una categoría válida.');
  if (!description || description.length > 500) {
    throw new ValidationError('La descripción debe tener entre 1 y 500 caracteres.');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000) {
    throw new ValidationError('La cantidad debe ser un número positivo y válido.');
  }
  if (!zone || zone.length > 100) throw new ValidationError('Ingresá una zona general válida.');
  if (!isDateOnly(date)) {
    throw new ValidationError('Ingresá una fecha válida.');
  }

  const limitCheck = checkRequestLimits(
    category,
    amount,
    previousRequests.filter(request => request.beneficiaryId === user.id)
  );

  return {
    id,
    category,
    description,
    amount,
    unit: CATEGORY_LIMITS[category].unit,
    zone,
    date,
    status: 'En revisión',
    priority: 'Media',
    goal: amount,
    received: 0,
    beneficiaryId: user.id,
    limitExceeded: limitCheck.exceeded,
    requiresException: limitCheck.exceeded,
    limitDetails: limitCheck.exceeded ? limitCheck.reason : null,
    decisionReason: null,
    decisionDate: null,
    createdAt: today
  };
}

export function evaluateRequest(request, input, allRequests, adminUser) {
  const decision = input?.status;
  const priority = input?.priority;
  const reason = typeof input?.decisionReason === 'string' ? input.decisionReason.trim() : '';
  const decisionDate = typeof input?.decisionDate === 'string' ? input.decisionDate : '';

  if (!VALID_DECISIONS.has(decision)) throw new ValidationError('Seleccioná una decisión válida.');
  if (!VALID_PRIORITIES.has(priority)) throw new ValidationError('Seleccioná una prioridad válida.');
  if (!reason || reason.length > 1000) throw new ValidationError('Ingresá un motivo de hasta 1000 caracteres.');
  if (!isDateOnly(decisionDate)) {
    throw new ValidationError('Ingresá una fecha de decisión válida.');
  }

  const limitCheck = checkRequestLimits(
    request.category,
    request.amount,
    allRequests.filter(item => item.id !== request.id && item.beneficiaryId === request.beneficiaryId)
  );
  const exceeded = Boolean(request.limitExceeded || request.requiresException || limitCheck.exceeded);
  const exceptionReason = typeof input.exceptionReason === 'string' ? input.exceptionReason.trim() : '';
  const authorizedBy = typeof adminUser?.name === 'string' ? adminUser.name : '';

  if (decision === 'Aprobada' && exceeded && (!input.exceptionGranted || !exceptionReason || !authorizedBy)) {
    throw new ValidationError('La aprobación excede los límites y requiere una excepción justificada.');
  }

  return {
    status: decision,
    priority,
    decisionReason: reason,
    decisionDate,
    limitExceeded: exceeded,
    exceptionGranted: decision === 'Aprobada' && exceeded,
    exceptionReason: decision === 'Aprobada' && exceeded ? exceptionReason : null,
    exceptionAuthorizedBy: decision === 'Aprobada' && exceeded ? authorizedBy : null,
    exceptionDate: decision === 'Aprobada' && exceeded ? decisionDate : null
  };
}
