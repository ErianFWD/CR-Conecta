import { mutationPrompt, requestConfirmation } from '../services/confirmation';
import { API_URL } from '../constants/config';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const prompt = mutationPrompt(path, (options.method || 'GET').toUpperCase(), options.body);
  if (prompt && !(await requestConfirmation(prompt))) throw new ApiError('Operación cancelada.', 0);
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new ApiError(
      payload?.message || `La operación falló (HTTP ${response.status}).`,
      response.status
    );
    if (response.status === 401 && path !== '/auth/session' && path !== '/auth/login' && path !== '/auth/logout') {
      window.dispatchEvent(new CustomEvent('cr:unauthorized'));
    }
    throw error;
  }

  return response.status === 204 ? null : payload;
}
