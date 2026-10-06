import { normalize } from './forecast.js';

export function evaluateTrackedProjection(record, donations, now = new Date()) {
  const start = Date.parse(record.startedAt);
  const end = Date.parse(record.endsAt);
  const baseline = new Set(record.baselineDonationIds || []);
  const actual = donations.reduce((sum, donation) => {
    const time = Date.parse(donation.createdAt || `${donation.date}T23:59:59.999Z`);
    if (baseline.has(donation.id) || normalize(donation.category) !== normalize(record.scenario.category)
      || (record.scope === 'empresa' && donation.donorId !== record.ownerId)
      || !Number.isFinite(time) || time < start || time > end || time > now.getTime()
      || ['cancelada', 'rechazada', 'anulada'].includes(normalize(donation.status))) return sum;
    const quantity = Number(donation.quantity);
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
  const status = actual >= record.scenario.goal ? 'cumplida' : now.getTime() >= end ? 'fallida' : 'en_curso';
  return { actual: Math.round(actual * 100) / 100, status };
}

export function publicTrackedProjection(record, donations, now) {
  const { baselineDonationIds: _baseline, ...publicRecord } = record;
  return { ...publicRecord, ...evaluateTrackedProjection(record, donations, now) };
}
