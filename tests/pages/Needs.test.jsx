import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Needs } from '../../src/pages/Needs';
import { useData } from '../../src/lib/useData';
jest.mock('../../src/lib/useData', () => ({ useData: jest.fn() }));
const rows = [
  { id: '1', category: 'Vestimenta', description: 'Ropa urgente', priority: 'Alta', status: 'Aprobada' },
  { id: '2', category: 'Vestimenta', description: 'Ropa normal', priority: 'Media', status: 'Aprobada' },
  { id: '3', category: 'Vestimenta', description: 'Caso privado', priority: 'Alta', status: 'En revisión' }
];
test('only displays approved requests and filters by priority', () => {
  useData.mockReturnValue({ data: rows, state: 'ready' });
  render(<MemoryRouter><Needs /></MemoryRouter>);
  expect(screen.queryByText('Caso privado')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Alta/ }));
  expect(screen.getByText('Ropa urgente')).toBeInTheDocument();
  expect(screen.queryByText('Ropa normal')).not.toBeInTheDocument();
});
test('opens the selected approved need', () => {
  useData.mockReturnValue({ data: rows.slice(0, 1), state: 'ready' });
  const onOpenNeedModal = jest.fn();
  render(<MemoryRouter><Needs onOpenNeedModal={onOpenNeedModal} /></MemoryRouter>);
  fireEvent.click(screen.getByText('Conocer esta necesidad'));
  expect(onOpenNeedModal).toHaveBeenCalledWith(rows[0]);
});
