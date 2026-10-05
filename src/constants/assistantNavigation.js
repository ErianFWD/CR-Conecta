export const ASSISTANT_DESTINATIONS = Object.freeze({
  inicio: Object.freeze({ path: '/', label: 'Inicio' }),
  necesidades: Object.freeze({ path: '/necesidades', label: 'Necesidades' }),
  donar: Object.freeze({ path: '/donar', label: 'Donar' }),
  solicitar: Object.freeze({ path: '/solicitar', label: 'Solicitar ayuda' }),
  acceso: Object.freeze({ path: '/acceso', label: 'Acceso' }),
  chat: Object.freeze({ path: '/chat', label: 'Asistente' })
});

export function resolveAssistantDestination(value) {
  if (typeof value !== 'string') return null;
  const destination = ASSISTANT_DESTINATIONS[value];
  return destination ? { path: destination.path, label: destination.label } : null;
}

export function validateAssistantPath(value) {
  if (typeof value !== 'string') return null;
  const destination = Object.values(ASSISTANT_DESTINATIONS).find(item => item.path === value);
  return destination ? { path: destination.path, label: destination.label } : null;
}
