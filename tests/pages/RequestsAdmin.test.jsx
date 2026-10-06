import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RequestsAdmin } from '../../src/pages/RequestsAdmin';
import { useData } from '../../src/lib/useData';
jest.mock('../../src/lib/useData', () => ({ useData: jest.fn() }));
const row = { id: 'REQ1', description: 'Alimentos para familia', category: 'Alimentos sellados', amount: 5, priority: 'Alta', status: 'En revisión', zone: 'Barranca' };
test('admin has evaluation actions for pending requests', () => {
  useData.mockReturnValue({ data: [row], state: 'ready' });
  render(<MemoryRouter><RequestsAdmin session={{ id: 'a', role: 'Administrador' }} /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /evaluar|dictamen/i })).toBeInTheDocument();
});
test('donor has no evaluation actions', () => {
  useData.mockReturnValue({ data: [{ ...row, status: 'Aprobada' }], state: 'ready' });
  render(<MemoryRouter><RequestsAdmin session={{ id: 'd', role: 'Donante individual' }} /></MemoryRouter>);
  expect(screen.queryByRole('button', { name: /evaluar|dictamen/i })).not.toBeInTheDocument();
});
