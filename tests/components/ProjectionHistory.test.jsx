import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectionHistory } from '../../src/components/ProjectionHistory';
import { api } from '../../src/lib/api';
import { downloadProjectionPdf } from '../../src/lib/projectionPdf';
import { trackingFixture, projectionFixture } from '../fixtures';
jest.mock('../../src/lib/api', () => ({ api: jest.fn() }));
jest.mock('../../src/lib/projectionPdf', () => ({ downloadProjectionPdf: jest.fn().mockResolvedValue() }));
test('shows actual saved progress and exports its original snapshot', async () => {
  const row = { ...trackingFixture, snapshot: projectionFixture() };
  api.mockResolvedValue([row]);
  render(<ProjectionHistory />);
  expect(await screen.findByText('31 / 30')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Descargar PDF'));
  await waitFor(() => expect(downloadProjectionPdf).toHaveBeenCalledWith(row.snapshot, row));
});
test('displays a load failure instead of claiming there are no saved targets', async () => {
  api.mockRejectedValue(new Error('Servidor desconectado'));
  render(<ProjectionHistory />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Servidor desconectado');
  expect(screen.queryByText(/Aún no hay metas/)).not.toBeInTheDocument();
});
