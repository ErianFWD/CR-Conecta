import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignProjection } from '../../src/components/CampaignProjection';
import { api } from '../../src/lib/api';
import { downloadProjectionPdf, readProjectionPdf } from '../../src/lib/projectionPdf';
import { projectionFixture } from '../fixtures';
jest.mock('../../src/lib/api', () => ({ api: jest.fn() }));
jest.mock('../../src/lib/projectionPdf', () => ({ downloadProjectionPdf: jest.fn().mockResolvedValue(), readProjectionPdf: jest.fn(), downloadHistoryTemplate: jest.fn() }));
beforeEach(() => { api.mockImplementation(path => Promise.resolve(path === '/projections' ? [] : projectionFixture())); });
test('loads a preview without creating a tracked target, then saves an explicit calculation', async () => {
  render(<CampaignProjection />);
  await screen.findByText('Vista previa sin seguimiento.', { exact: false });
  expect(JSON.parse(api.mock.calls.find(([p]) => p.includes('campaign-projection'))[1].body).track).toBe(false);
  fireEvent.change(screen.getByLabelText('Meta (unidades)'), { target: { value: '45' } });
  fireEvent.click(screen.getByText('Calcular proyección'));
  await waitFor(() => expect(api).toHaveBeenCalledWith('/assistant/campaign-projection', expect.objectContaining({ body: expect.stringContaining('"goal":45') })));
  const body = JSON.parse(api.mock.calls.filter(([p]) => p.includes('campaign-projection')).at(-1)[1].body);
  expect(body.track).toBe(true); expect(body.useAI).toBe(true);
});
test('downloads the actual result as PDF', async () => {
  render(<CampaignProjection />);
  fireEvent.click(await screen.findByRole('button', { name: 'Descargar PDF' }));
  await waitFor(() => expect(downloadProjectionPdf).toHaveBeenCalledWith(expect.objectContaining({ scenario: expect.objectContaining({ goal: 30 }) })));
});
test('passes imported PDF history to the calculation', async () => {
  const rows = [{ date: '2026-01-01', category: 'Alimentos sellados', quantity: 10 }];
  readProjectionPdf.mockResolvedValue(rows);
  render(<CampaignProjection />);
  await screen.findByText('Calcular proyección');
  fireEvent.change(screen.getByLabelText('Seleccionar PDF'), { target: { files: [new File(['pdf'], 'data.pdf')] } });
  await screen.findByText(/data.pdf: 1 registros/);
  fireEvent.click(screen.getByText('Calcular proyección'));
  await waitFor(() => expect(JSON.parse(api.mock.calls.filter(([p]) => p.includes('campaign-projection')).at(-1)[1].body).importedHistory).toEqual(rows));
});
test('displays server error without claiming a completed projection', async () => {
  api.mockImplementation(path => path === '/projections' ? Promise.resolve([]) : Promise.reject(new Error('Sin conexión con el servidor')));
  render(<CampaignProjection />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión');
  expect(screen.queryByRole('button', { name: 'Descargar PDF' })).not.toBeInTheDocument();
});

test('a long projection displays sparse axis labels and the chart legend', async () => {
  const result = projectionFixture();
  result.scenario.weeks = 52;
  result.forecast.weeks = Array.from({ length: 52 }, (_, i) => ({
    week: i + 1, base: 2, low: 1, high: 3,
    cumulativeBase: (i + 1) * 2, cumulativeLow: i + 1, cumulativeHigh: (i + 1) * 3
  }));
  result.forecast.totals = { base: 104, low: 52, high: 156 };
  api.mockImplementation(path => Promise.resolve(path === '/projections' ? [] : result));
  render(<CampaignProjection />);
  await screen.findByText('Aportes estimados');
  const svg = screen.getByRole('img', { name: /Proyección acumulada/ });
  expect(svg.querySelectorAll('text').length).toBeLessThan(25);
  expect(screen.getAllByText('Rango orientativo').length).toBeGreaterThan(0);
});
