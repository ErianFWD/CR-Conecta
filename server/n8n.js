export async function notifyN8n({ url, token, type, data, fetchImpl = fetch }) {
  if (!url || !token) return false;
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CR-Conecta-Token': token },
      body: JSON.stringify({ eventId: `${type}:${data.id}`, type, occurredAt: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch {
    // La operación guardada en la API sigue siendo válida aunque falle la automatización.
    console.warn(`No se pudo entregar el aviso n8n de ${type}.`);
    return false;
  }
}
