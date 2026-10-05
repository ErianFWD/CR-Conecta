// Dirección de la API local. Se puede cambiar con un archivo .env:
//   VITE_API_URL=http://localhost:3001
export const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:3001';
