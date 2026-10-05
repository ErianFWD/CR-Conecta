import { api } from '../lib/api';
export const emptyLocation = { provinceId: '', province: '', cantonId: '', canton: '', districtId: '', district: '' };
export const profileDetails = session => ({ identification: session?.identification || '', name: session?.name || '', location: session?.location || { ...emptyLocation } });
export const getProvinces = signal => api('/lookups/geo/provinces', { signal });
export const getCantons = (id, signal) => api(`/lookups/geo/cantons?parent=${encodeURIComponent(id)}`, { signal });
export const getDistricts = (id, signal) => api(`/lookups/geo/districts?parent=${encodeURIComponent(id)}`, { signal });
export const getIdentity = (id, signal) => api(`/lookups/identity?identification=${encodeURIComponent(id)}`, { signal });
