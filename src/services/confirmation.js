let handler;
export function setConfirmationHandler(next) { handler = next; }
export function requestConfirmation(details) {
  return handler ? handler(details) : Promise.resolve(false);
}
export function mutationPrompt(path, method, body) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) return null;
  if (/^\/(auth\/login|assistant|projections|lookups)(\/|$)/.test(path)) return null;
  if (path === '/auth/logout') return { title: 'Cerrar sesión', text: '¿Querés cerrar tu sesión?' };
  if (method === 'DELETE') return { title: 'Eliminar registro', text: '¿Querés eliminar este registro? Esta acción no se puede deshacer.', danger: true };
  let data = {};
  try { data = JSON.parse(body || '{}'); } catch { /* Body may be FormData. */ }
  if (data.status === 'Aprobada' || data.status === 'Denegada') {
    return { title: 'Confirmar dictamen', text: `¿Querés guardar la solicitud como ${data.status.toLowerCase()}?` };
  }
  if (data.deliveryConfirmed) return { title: 'Confirmar entrega', text: '¿Confirmás que recibiste la ayuda?' };
  const titles = { '/donations': 'Registrar donación', '/requests': 'Registrar solicitud', '/users': 'Registrar cuenta', '/auth/register': 'Crear mi cuenta', '/sections': 'Publicar sección' };
  return { title: titles[path] || 'Guardar cambios', text: 'Revisá los datos. ¿Querés aceptar y guardar esta operación?' };
}
