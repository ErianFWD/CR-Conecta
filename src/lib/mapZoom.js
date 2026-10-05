export const MIN_MAP_ZOOM = 12;
export const MAX_MAP_ZOOM = 18;
export const DEFAULT_MAP_ZOOM = 14;

export function getMapBounds({ lat, lon }, zoom) {
  const scale = 2 ** (zoom - DEFAULT_MAP_ZOOM);
  const longitudeRadius = 0.018 / scale;
  const latitudeRadius = 0.012 / scale;
  return `${lon - longitudeRadius},${lat - latitudeRadius},${lon + longitudeRadius},${lat + latitudeRadius}`;
}
