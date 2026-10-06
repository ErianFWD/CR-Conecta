import { buildForecast, automaticNarrative } from '../server/forecast.js';
export function projectionFixture() {
  const result = buildForecast({ scenario: { category: 'Alimentos sellados', goal: 30, weeks: 6 }, today: new Date('2026-10-06T12:00:00Z'), donations: [{ date: '2026-10-05', category: 'Alimentos sellados', quantity: 8 }] });
  return { ...result, narrative: automaticNarrative(result), dataSource: 'plataforma' };
}
export const trackingFixture = { id: 'p1', scenario: { category: 'Alimentos sellados', goal: 30, weeks: 6 }, status: 'cumplida', actual: 31, endsAt: '2026-11-17T12:00:00Z' };
