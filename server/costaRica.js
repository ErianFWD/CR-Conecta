const GEO_BASE = 'https://api-geo-cr.vercel.app';
const HACIENDA_BASE = 'https://api.hacienda.go.cr/fe/ae';
const cache = new Map();
function fail(message, status = 400) { return Object.assign(new Error(message), { status }); }
async function remoteJson(url, fetchImpl) {
  let response;
  try { response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }); }
  catch { throw fail('El servicio externo no está disponible. Probá nuevamente en unos minutos.', 503); }
  if (response.status === 404) throw fail('No se encontraron datos para esta consulta.', 404);
  if (response.status === 429) throw fail('El servicio alcanzó su límite de consultas. Esperá antes de reintentar.', 429);
  if (!response.ok) throw fail('No se pudo consultar el servicio externo.', 502);
  try { return await response.json(); } catch { throw fail('El servicio devolvió una respuesta no válida.', 502); }
}
export async function lookupIdentity(id, fetchImpl = fetch) {
  if (!/^\d{9,12}$/.test(id || '')) throw fail('La cédula debe contener de 9 a 12 dígitos, sin guiones.');
  const key = `identity:${id}`;
  const saved = cache.get(key);
  if (saved?.expires > Date.now()) return saved.value;
  const result = await remoteJson(`${HACIENDA_BASE}?identificacion=${id}`, fetchImpl);
  if (typeof result.nombre !== 'string' || !result.nombre.trim()) throw fail('Hacienda no encontró un nombre. Podés escribirlo manualmente.', 404);
  const value = { identification: id, name: result.nombre.trim().slice(0, 120), source: 'Ministerio de Hacienda' };
  if (cache.size > 500) cache.clear();
  cache.set(key, { value, expires: Date.now() + 15 * 60 * 1000 });
  return value;
}
export function normalizeGeoRows(result, kind) {
  const rows = Array.isArray(result) ? result : result?.data;
  if (!Array.isArray(rows)) throw fail('Geo CR devolvió datos no válidos.', 502);
  const field = { provinces: 'idProvincia', cantons: 'idCanton', districts: 'idDistrito' }[kind];
  return rows.map(row => ({ id: String(row[field] ?? row.id ?? ''), name: String(row.descripcion ?? row.nombre ?? '') }))
    .filter(row => /^\d+$/.test(row.id) && row.name);
}
export async function lookupGeography(kind, parent, fetchImpl = fetch) {
  if (!['provinces', 'cantons', 'districts'].includes(kind) || (kind !== 'provinces' && !/^\d{1,5}$/.test(parent || ''))) throw fail('Seleccioná una ubicación válida.');
  const path = kind === 'provinces' ? '/provincias' : kind === 'cantons' ? `/provincias/${parent}/cantones` : `/cantones/${parent}/distritos`;
  const cached = cache.get(path);
  if (cached?.expires > Date.now()) return cached.value;
  let all = [];
  for (let page = 1; page <= 20; page += 1) {
    const result = await remoteJson(`${GEO_BASE}${path}?page=${page}&limit=100`, fetchImpl);
    all = [...all, ...normalizeGeoRows(result, kind)];
    if (page >= (Number(result?.meta?.totalPages) || 1)) break;
  }
  const value = [...new Map(all.map(row => [row.id, row])).values()];
  if (!value.length) throw fail('Geo CR no devolvió ubicaciones. Reintentá la consulta.', 502);
  cache.set(path, { value, expires: Date.now() + 24 * 60 * 60 * 1000 });
  return value;
}
export function registrationDetails(input, required = false) {
  const identification = String(input.identification || '').replace(/[\s-]/g, '');
  if ((required || identification) && !/^\d{9,12}$/.test(identification)) throw fail('Ingresá una cédula válida de 9 a 12 dígitos.');
  const location = input.location;
  if (!location) {
    if (required) throw fail('Seleccioná provincia y cantón.');
    return identification ? { identification } : {};
  }
  const clean = {};
  for (const key of ['provinceId','province','cantonId','canton','districtId','district']) {
    const value = location[key] ?? '';
    if (typeof value !== 'string' || value.length > 100) throw fail('La ubicación contiene datos inválidos.');
    clean[key] = value.trim();
  }
  if (!/^[1-7]$/.test(clean.provinceId) || !/^\d{1,5}$/.test(clean.cantonId) || !clean.province || !clean.canton
    || (clean.districtId && !/^\d{1,5}$/.test(clean.districtId))) throw fail('Seleccioná provincia y cantón válidos.');
  return { identification, location: clean, zone: clean.district || clean.canton };
}
