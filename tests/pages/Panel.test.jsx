import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Panel } from '../../src/pages/Panel';
import { useData } from '../../src/lib/useData';
import { api } from '../../src/lib/api';
import { projectionFixture } from '../fixtures';
jest.mock('../../src/lib/useData', () => ({ useData: jest.fn() }));
jest.mock('../../src/lib/api', () => ({ api: jest.fn() }));
beforeEach(() => {
  useData.mockReturnValue({ data: [], state: 'ready' });
  api.mockImplementation(path => Promise.resolve(path === '/projections' ? [] : projectionFixture()));
});
function renderPanel(role) { return render(<MemoryRouter><Panel session={role ? { id: 'u1', name: 'Prueba', role } : null} /></MemoryRouter>); }
test('admin can access the real projection component and PDF controls in the overview', async () => {
  renderPanel('Administrador');
  expect(await screen.findByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument();
  expect(screen.getByLabelText('Seleccionar PDF')).toBeInTheDocument();
});
test('company accesses projections through campañas y empleo', async () => {
  renderPanel('Empresa donante');
  expect(screen.queryByLabelText('Seleccionar PDF')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /campañas y empleo/i }));
  expect(await screen.findByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument();
});
test('individual donors cannot see the projection controls', () => {
  renderPanel('Donante individual');
  expect(screen.queryByLabelText('Seleccionar PDF')).not.toBeInTheDocument();
});
test('signed-out visitors see restricted access', () => {
  renderPanel(null);
  expect(screen.getByText('Acceso restringido por rol')).toBeInTheDocument();
});
test('shows a load error when a panel data request fails', () => {
  useData.mockReturnValue({ data: [], state: 'error' });
  renderPanel('Donante individual');
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
